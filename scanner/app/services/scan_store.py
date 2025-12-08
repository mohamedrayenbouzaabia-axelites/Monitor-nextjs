"""SQLite-backed persistence for completed scan jobs."""
from __future__ import annotations

import datetime as dt
import json
import os
import sqlite3
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..schemas import TargetScanResult

BASE_DIR = Path(__file__).resolve().parents[2]
SCAN_DB_PATH = os.getenv("SCAN_DB_PATH") or str(BASE_DIR / "data" / "scans.sqlite")

_INIT_LOCK = threading.Lock()
_INITIALIZED = False


def _ensure_db() -> None:
    """Create SQLite database if it doesnt exist"""
    global _INITIALIZED  # pylint: disable=global-statement
    if _INITIALIZED:
        return
    with _INIT_LOCK:
        if _INITIALIZED:
            return
        db_path = Path(SCAN_DB_PATH)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS scan_jobs (
                    token TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    started_at TEXT,
                    finished_at TEXT,
                    payload TEXT NOT NULL
                )
                """
            )
        _INITIALIZED = True


def _json_serializer(value: Any) -> str:
    if isinstance(value, dt.datetime):
        return value.isoformat()
    raise TypeError(f"Type not serializable: {type(value)}")


def _coerce_datetime(value: Any) -> Optional[str]:
    if isinstance(value, dt.datetime):
        return value.isoformat()
    if isinstance(value, str):
        return value
    return None


def _normalize_results(results: List[Any]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for item in results or []:
        if isinstance(item, TargetScanResult):
            normalized.append(item.model_dump())
        elif hasattr(item, "model_dump"):
            normalized.append(item.model_dump())  # type: ignore[call-arg]
        elif isinstance(item, dict):
            normalized.append(item)
        else:
            # Last-resort serialization for unexpected payloads.
            normalized.append(json.loads(json.dumps(item, default=_json_serializer)))
    return normalized


def _rehydrate_results(results: List[Any]) -> List[TargetScanResult]:
    hydrated: List[TargetScanResult] = []
    for item in results or []:
        if isinstance(item, TargetScanResult):
            hydrated.append(item)
        elif isinstance(item, dict):
            hydrated.append(TargetScanResult(**item))
    return hydrated


def persist_scan_job(job: Dict[str, Any]) -> None:
    """Persist a completed scan job to SQLite."""
    if not job or not job.get("token"):
        return
    _ensure_db()
    normalized = dict(job)
    normalized["results"] = _normalize_results(normalized.get("results", []))
    payload = json.dumps(normalized, default=_json_serializer)
    with sqlite3.connect(SCAN_DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO scan_jobs (token, status, mode, started_at, finished_at, payload)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(token) DO UPDATE SET
                status=excluded.status,
                mode=excluded.mode,
                started_at=excluded.started_at,
                finished_at=excluded.finished_at,
                payload=excluded.payload
            """,
            (
                normalized.get("token"),
                normalized.get("status", "unknown"),
                normalized.get("mode", "standard"),
                _coerce_datetime(normalized.get("started_at")),
                _coerce_datetime(normalized.get("finished_at")),
                payload,
            ),
        )
        conn.commit()


def load_scan_job(token: str) -> Optional[Dict[str, Any]]:
    """Load a job by token from SQLite, if present."""
    if not token:
        return None
    _ensure_db()
    with sqlite3.connect(SCAN_DB_PATH) as conn:
        row = conn.execute(
            "SELECT payload FROM scan_jobs WHERE token = ?", (token,)
        ).fetchone()
    if not row:
        return None

    data = json.loads(row[0])
    for key in ("started_at", "finished_at"):
        if isinstance(data.get(key), str):
            try:
                data[key] = dt.datetime.fromisoformat(data[key])
            except ValueError:
                data[key] = data.get(key)
    data["results"] = _rehydrate_results(data.get("results", []))
    return data


__all__ = ["load_scan_job", "persist_scan_job", "SCAN_DB_PATH"]
