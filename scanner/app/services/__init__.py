"""Service layer for background scanning tasks."""

from .scanner import get_scan_job, queue_scan

__all__ = [
    "get_scan_job",
    "queue_scan",
]
