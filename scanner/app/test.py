"""Simple manual test for the standard (non-AI) scan flow.

Run the FastAPI app first (e.g., `uvicorn app.main:app --reload`), then execute:
    python app/test.py
It will kick off a scan against a known public Amazon IP and poll until complete.
"""
from __future__ import annotations

import time

import httpx

# Base URL of the running FastAPI service.
API_BASE = "http://127.0.0.1:8000"

# Public Amazon IP to probe. You can swap this for any other target.
TEST_IP = "52.94.225.248"


def start_scan(client: httpx.Client) -> str:
    payload = {"ip_addresses": [TEST_IP]}
    resp = client.post(f"{API_BASE}/scan", json=payload)
    resp.raise_for_status()
    data = resp.json()
    token = data["token"]
    print(f"Started scan. Token: {token} | Status URL: {data['status_url']}")
    return token


def poll_status(client: httpx.Client, token: str) -> dict:
    while True:
        resp = client.get(f"{API_BASE}/scan/{token}")
        resp.raise_for_status()
        job = resp.json()
        print(
            f"Status: {job['status']} | Completed: {job['completed_targets']}/{job['total_targets']}"
        )
        if job["status"] == "complete":
            return job
        time.sleep(1.5)


def main() -> None:
    with httpx.Client(timeout=15.0) as client:
        token = start_scan(client)
        result = poll_status(client, token)
    print("\nFinal result:")
    print(result)


if __name__ == "__main__":
    main()
