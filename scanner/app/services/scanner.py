"Scanning utilities, workers, and queue management."
from __future__ import annotations

import datetime as dt
import ipaddress
import socket
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import httpx

from ..schemas import AccessibilityProbe, TargetScanResult
from .gemini_client import GeminiClient
from .scan_store import load_scan_job, persist_scan_job


COMMON_PORTS = {
    21: "FTP",
    22: "SSH",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    465: "SMTPS",
    587: "Submission",
    993: "IMAPS",
    995: "POP3S",
    1433: "MSSQL",
    1521: "Oracle",
    1723: "PPTP",
    2049: "NFS",
    2375: "Docker", #Docker's default behavious côté config
    3306: "MySQL", #
    3389: "RDP", #
    5432: "PostgreSQL",
    5900: "VNC", #
    6379: "Redis",
    8080: "HTTP-Alt",
    8443: "HTTPS-Alt",
}
#Remote control portz
HIGH_RISK_PORTS = {22, 3306, 3389, 5900, 2375}

SCAN_REGISTRY: Dict[str, Dict[str, Any]] = {}
LOCK = threading.Lock()
EXECUTOR = ThreadPoolExecutor(max_workers=4)
_GEMINI_CLIENT: Optional[GeminiClient] = None
PER_TARGET_MAX_WORKERS = 4


def _get_gemini_client() -> GeminiClient:
    """Lazy initializer so env is honored even if loaded after import."""
    global _GEMINI_CLIENT  # pylint: disable=global-statement
    if _GEMINI_CLIENT is None or not getattr(_GEMINI_CLIENT, "api_key", None):
        _GEMINI_CLIENT = GeminiClient()
    return _GEMINI_CLIENT


def normalize_target(target: str) -> str:
    """Return hostname or IP extracted from a raw target string."""
    parsed = urlparse(target)
    hostname = parsed.hostname if parsed.scheme else target
    if not hostname:
        raise ValueError(f"Unable to parse hostname from target '{target}'.")
    return hostname


def resolve_target_to_ip(target: str) -> str:
    hostname = normalize_target(target)
    try:
        ipaddress.ip_address(hostname)
        return hostname
    except ValueError:
        try:
            return socket.gethostbyname(hostname)
        except socket.gaierror as exc:
            raise ValueError(f"Failed to resolve {hostname}: {exc}") from exc


def fetch_ip_metadata(ip: str) -> Dict[str, Any]:
    url = (
        f"http://ip-api.com/json/{ip}?fields="
        "status,message,country,regionName,city,isp,org,asname,proxy,hosting,mobile"
    )
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(url)
        resp.raise_for_status()
        data = resp.json()
        if data.get("status") != "success":
            raise ValueError(data.get("message", "IP lookup failed."))
        return data


def probe_ports(ip: str) -> List[AccessibilityProbe]:
    probes: List[AccessibilityProbe] = []
    for port, service in COMMON_PORTS.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.8)
        try:
            sock.connect((ip, port))
            probes.append(AccessibilityProbe(port=port, service=service, status="open"))
        except (socket.timeout, ConnectionRefusedError, OSError):
            probes.append(
                AccessibilityProbe(port=port, service=service, status="closed")
            )
        finally:
            sock.close()
    return probes


def interpret_risk(
    scan_result: Dict[str, Any], gemini_summary_enabled: bool = True
) -> Tuple[str, str, Optional[str]]:
    """Assess exposure risk using the full scan result context."""
    open_ports = scan_result.get("open_ports", [])

    if gemini_summary_enabled:
        try:
            ai_risk = _get_gemini_client().generate_risk_assessment(scan_result)

            # Check if Gemini returned a rate limit signal
            if ai_risk.get("risk_level") is None and ai_risk.get("risk_summary") == "rate_limited":
                # Rate limited - fall back to deterministic rules
                import logging
                logger = logging.getLogger(__name__)
                logger.info("Gemini API rate limit hit, using deterministic fallback rules")
                pass
            elif ai_risk.get("risk_level") != "unknown" or ai_risk.get("risk_summary"):
                # Valid Gemini response - return it as-is
                return (
                    ai_risk.get("risk_level", "unknown"),
                    ai_risk.get("risk_summary", ""),
                    ai_risk.get("recommendation"),
                )

        except Exception as exc:  # pylint: disable=broad-except
            # Fall back to deterministic rules if Gemini is unavailable.
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Gemini API error, using deterministic fallback: {exc}")
            pass

    # Deterministic fallback rules
    high_risk = HIGH_RISK_PORTS.intersection(open_ports)
    if high_risk:
        return (
            "high",
            f"Critical services exposed on ports {sorted(high_risk)}.",
            "Restrict access, close management ports, and enforce firewall rules.",
        )
    if len(open_ports) > 2:
        return (
            "medium",
            "Multiple services exposed on the public internet.",
            "Harden exposed services, enable TLS, and whitelist trusted sources.",
        )
    return ("low", "Limited exposure detected.", None)


def build_scan_result(
    target: str, gemini_summary_enabled: bool = True
) -> TargetScanResult:
    resolved_ip = resolve_target_to_ip(target)
    metadata = fetch_ip_metadata(resolved_ip)
    probes = probe_ports(resolved_ip)
    open_ports = [probe.port for probe in probes if probe.status == "open"]
    availability = bool(open_ports)
    public_ip = not ipaddress.ip_address(resolved_ip).is_private
    location = ", ".join(
        part for part in (metadata.get("city"), metadata.get("regionName")) if part
    ) or None
    service_category = "Hosting Provider" if metadata.get("hosting") else None
    if metadata.get("proxy"):
        service_category = "Proxy / VPN"
    elif metadata.get("mobile"):
        service_category = "Mobile Network"
    provider = metadata.get("isp") or metadata.get("org")
    result_payload: Dict[str, Any] = {
        "target": target,
        "ip_address": resolved_ip,
        "availability": availability,
        "location": location,
        "country": metadata.get("country"),
        "provider": provider,
        "service_category": service_category,
        "publicly_exposed": public_ip,
        "open_ports": open_ports,
        "accessibility_tests": probes,
    }

    risk_level, risk_summary, recommendation = interpret_risk(
        result_payload, gemini_summary_enabled=gemini_summary_enabled
    )
    return TargetScanResult(
        risk_level=risk_level,
        risk_summary=risk_summary,
        recommendation=recommendation,
        **result_payload,
    )


def _build_error_result(raw_target: str, exc: Exception) -> TargetScanResult:
    """Create a TargetScanResult that communicates scan failures."""
    return TargetScanResult(
        target=raw_target,
        ip_address="unknown",
        availability=False,
        location=None,
        country=None,
        provider=None,
        service_category=None,
        publicly_exposed=False,
        open_ports=[],
        accessibility_tests=[],
        risk_level="unknown",
        risk_summary=str(exc),
        recommendation=None,
    )


def _scan_target(
    raw_target: str, gemini_summary_enabled: bool
) -> Tuple[TargetScanResult, str]:
    """Run the full scan pipeline for a single target."""
    try:
        result = build_scan_result(
            raw_target,
            gemini_summary_enabled=gemini_summary_enabled,
        )
        return result, "completed"
    except Exception as exc:  # pylint: disable=broad-except
        return _build_error_result(raw_target, exc), "error"


def scan_worker(
    token: str,
    targets: List[str],
    gemini_summary_enabled: bool = True,
) -> None:
    snapshot_to_persist: Optional[Dict[str, Any]] = None
    if not targets:
        with LOCK:
            job = SCAN_REGISTRY.get(token)
            if job:
                job["status"] = "completed"
                job["finished_at"] = dt.datetime.utcnow()
                snapshot_to_persist = dict(job)
        if snapshot_to_persist:
            persist_scan_job(snapshot_to_persist)
        return

    max_workers = max(1, min(len(targets), PER_TARGET_MAX_WORKERS))
    ordered_results: Dict[int, TargetScanResult] = {}

    with ThreadPoolExecutor(max_workers=max_workers) as target_executor:
        future_to_meta = {}
        for index, raw_target in enumerate(targets):
            future = target_executor.submit(
                _scan_target, raw_target, gemini_summary_enabled
            )
            future_to_meta[future] = (index, raw_target)
        for future in as_completed(future_to_meta):
            index, raw_target = future_to_meta[future]
            try:
                result, status = future.result()
            except Exception as exc:  # pylint: disable=broad-except
                result = _build_error_result(raw_target, exc)
                status = "failed"
            ordered_results[index] = result
            sorted_results = [ordered_results[i] for i in sorted(ordered_results)]
            with LOCK:
                job = SCAN_REGISTRY[token]
                job["results"] = sorted_results
                job["completed_targets"] = len(sorted_results)
                job["status"] = status
                if job["completed_targets"] >= job["total_targets"]:
                    job["status"] = "complete"
                    job["finished_at"] = dt.datetime.utcnow()
                    snapshot_to_persist = dict(job)

    if snapshot_to_persist:
        persist_scan_job(snapshot_to_persist)


def queue_scan(
    targets: List[str],
    ai_enabled: bool = False,
    gemini_summary_enabled: bool = True,
) -> str:
    token = uuid.uuid4().hex
    job_record = {
        "token": token,
        "total_targets": len(targets),
        "completed_targets": 0,
        "status": "queued",
        "mode": "ai" if ai_enabled else "standard",
        "started_at": dt.datetime.utcnow(),
        "finished_at": None,
        "results": [],
    }
    with LOCK:
        SCAN_REGISTRY[token] = job_record

    EXECUTOR.submit(
        scan_worker,
        token,
        targets,
        gemini_summary_enabled,
    )
    return token


def get_scan_job(token: str) -> Optional[Dict[str, Any]]:
    with LOCK:
        job = SCAN_REGISTRY.get(token)
    if job:
        return job

    stored_job = load_scan_job(token)
    if stored_job:
        with LOCK:
            SCAN_REGISTRY.setdefault(token, stored_job)
        return stored_job
    return None


__all__ = [
    "queue_scan",
    "get_scan_job",
]
