"""AWS functional test techniques mapper."""
from __future__ import annotations

import json
import os
from typing import List, Optional


def load_aws_functional_tests() -> dict:
    """Load AWS functional tests mapping from JSON file."""
    try:
        # Get the directory of this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up one level to app directory, then to data directory
        json_path = os.path.join(os.path.dirname(current_dir), "data", "aws_functional_tests.json")

        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        # Return empty dict if file not found
        return {}
    except json.JSONDecodeError:
        # Return empty dict if JSON is invalid
        return {}


# Cache the loaded tests to avoid repeated file reads
_AWS_TESTS_CACHE = None


def get_aws_service_test_techniques(service_name: str) -> List[str]:
    """
    Get functional test techniques for a specific AWS service.

    Args:
        service_name: The AWS service name (e.g., "S3", "EC2")

    Returns:
        List of test technique strings for the service, or empty list if not found
    """
    global _AWS_TESTS_CACHE

    if _AWS_TESTS_CACHE is None:
        _AWS_TESTS_CACHE = load_aws_functional_tests()

    # Normalize service name to match JSON keys
    normalized_service = service_name.upper().strip()

    # Try exact match first
    if normalized_service in _AWS_TESTS_CACHE:
        return _AWS_TESTS_CACHE[normalized_service]

    # Try to find partial matches (e.g., "AMAZON S3" -> "S3")
    for key, techniques in _AWS_TESTS_CACHE.items():
        if normalized_service == f"AMAZON {key}" or normalized_service.endswith(key):
            return techniques

    return []


def is_aws_service_supported(service_name: str) -> bool:
    """
    Check if an AWS service has functional test techniques defined.

    Args:
        service_name: The AWS service name

    Returns:
        True if the service has test techniques defined, False otherwise
    """
    return bool(get_aws_service_test_techniques(service_name))


def refresh_aws_tests_cache() -> None:
    """Force refresh the AWS tests cache (useful for testing or updates)."""
    global _AWS_TESTS_CACHE
    _AWS_TESTS_CACHE = None


__all__ = [
    "load_aws_functional_tests",
    "get_aws_service_test_techniques",
    "is_aws_service_supported",
    "refresh_aws_tests_cache"
]