"""AWS IP ranges and service detection module."""
from __future__ import annotations

import datetime as dt
import ipaddress
import json
import threading
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urljoin

import httpx

# Cache for AWS IP ranges data
_AWS_RANGES_CACHE: Dict[str, Any] = {}
_AWS_RANGES_LOCK = threading.Lock()
_CACHE_EXPIRY_HOURS = 6  # Refresh AWS IP ranges every 6 hours

# AWS service to category mapping
AWS_SERVICE_CATEGORIES = {
    "AMAZON": "Cloud Infrastructure",
    "S3": "Storage & Databases",
    "EC2": "Compute Services",
    "RDS": "Storage & Databases",
    "LAMBDA": "Compute Services",
    "CLOUDFRONT": "CDN & Content Delivery",
    "API_GATEWAY": "Networking & Content Delivery",
    "ROUTE53": "Networking & Content Delivery",
    "VPC": "Networking & Content Delivery",
    "ELASTICLOADBALANCING": "Networking & Content Delivery",
    "CLOUDWATCH": "Management & Governance",
    "IAM": "Security & Identity",
    "KMS": "Security & Identity",
    "SECRETS_MANAGER": "Security & Identity",
    "DYNAMODB": "Storage & Databases",
    "REDSHIFT": "Storage & Databases",
    "ElastiCache": "Storage & Databases",
    "DOCUMENTDB": "Storage & Databases",
    "NEPTUNE": "Storage & Databases",
    "ECS": "Compute Services",
    "EKS": "Compute Services",
    "BATCH": "Compute Services",
    "CODEBUILD": "Developer Tools",
    "CODEDEPLOY": "Developer Tools",
    "CODEPIPELINE": "Developer Tools",
    "CLOUDFORMATION": "Management & Governance",
    "SNS": "Messaging & Communication",
    "SQS": "Messaging & Communication",
    "SES": "Messaging & Communication",
    "WORKSPACES": "End User Computing",
    "APPSTREAM": "End User Computing",
    "CHIME": "End User Computing",
    "ATHENA": "Analytics",
    "EMR": "Analytics",
    "GLUE": "Analytics",
    "QUICKSIGHT": "Analytics",
    "KINESIS": "Analytics",
    "MACHINE_LEARNING": "Artificial Intelligence",
    "SAGEMAKER": "Artificial Intelligence",
    "COMPREHEND": "Artificial Intelligence",
    "REKOGNITION": "Artificial Intelligence",
    "POLLY": "Artificial Intelligence",
    "TRANSLATE": "Artificial Intelligence",
    "LEX": "Artificial Intelligence",
    "CERTIFICATE_MANAGER": "Security & Identity",
    "SHIELD": "Security & Identity",
    "WAF": "Security & Identity",
    "GUARDDUTY": "Security & Identity",
    "INSPECTOR": "Security & Identity",
    "MACIE": "Security & Identity",
    "SYSTEMS_MANAGER": "Management & Governance",
    "TRUSTED_ADVISOR": "Management & Governance",
    "CONFIG": "Management & Governance",
    "CLOUDTRAIL": "Management & Governance",
    "AUTO_SCALING": "Compute Services",
    "ELASTIC_BEANSTALK": "Compute Services"
}

def _is_cache_valid() -> bool:
    """Check if the AWS IP ranges cache is still valid."""
    if not _AWS_RANGES_CACHE:
        return False

    cached_at = _AWS_RANGES_CACHE.get("cached_at")
    if not cached_at:
        return False

    age = dt.datetime.utcnow() - cached_at
    return age.total_seconds() < (_CACHE_EXPIRY_HOURS * 3600)

def _fetch_aws_ip_ranges() -> Dict[str, Any]:
    """Fetch the latest AWS IP ranges from the official JSON endpoint."""
    url = "https://ip-ranges.amazonaws.com/ip-ranges.json"

    with httpx.Client(timeout=30.0) as client:
        response = client.get(url)
        response.raise_for_status()

        data = response.json()

        # Cache the data with timestamp
        with _AWS_RANGES_LOCK:
            _AWS_RANGES_CACHE.update({
                "syncToken": data.get("syncToken"),
                "createDate": data.get("createDate"),
                "prefixes": data.get("prefixes", []),
                "ipv6_prefixes": data.get("ipv6_prefixes", []),
                "cached_at": dt.datetime.utcnow()
            })

        return data

def get_aws_ip_ranges() -> Dict[str, Any]:
    """Get AWS IP ranges, using cache if available and valid."""
    with _AWS_RANGES_LOCK:
        if _is_cache_valid():
            return {
                "syncToken": _AWS_RANGES_CACHE["syncToken"],
                "createDate": _AWS_RANGES_CACHE["createDate"],
                "prefixes": _AWS_RANGES_CACHE["prefixes"],
                "ipv6_prefixes": _AWS_RANGES_CACHE["ipv6_prefixes"]
            }

    # Cache is stale or empty, fetch fresh data
    return _fetch_aws_ip_ranges()

def _ip_to_integer(ip: str) -> int:
    """Convert IP address to integer for comparison."""
    return int(ipaddress.ip_address(ip))

def _find_all_matching_prefixes(ip: str, prefixes: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Find all AWS prefixes that match the given IP address."""
    ip_int = _ip_to_integer(ip)
    matching_prefixes = []

    for prefix in prefixes:
        ip_prefix = prefix.get("ip_prefix")
        if not ip_prefix:
            continue

        try:
            network = ipaddress.ip_network(ip_prefix, strict=False)
            if ip_int in range(_ip_to_integer(str(network.network_address)),
                             _ip_to_integer(str(network.broadcast_address)) + 1):
                matching_prefixes.append(prefix)
        except ValueError:
            # Skip invalid CIDR blocks
            continue

    return matching_prefixes


def _find_best_matching_prefix(ip: str, prefixes: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
    """Find the best AWS prefix that matches the given IP address, prioritizing specific services over AMAZON."""
    matching_prefixes = _find_all_matching_prefixes(ip, prefixes)

    if not matching_prefixes:
        return None

    # Define service priority (higher number = higher priority)
    SERVICE_PRIORITY = {
        "S3": 10,
        "EC2": 9,
        "RDS": 8,
        "LAMBDA": 7,
        "CLOUDFRONT": 6,
        "API_GATEWAY": 5,
        "ROUTE53": 4,
        "DYNAMODB": 3,
        "ECS": 2,
        "EKS": 1,
        # All other specific services get priority 0
        "AMAZON": -1  # Lowest priority
    }

    # Sort by service priority (highest first)
    def get_priority(prefix):
        service = prefix.get("service", "AMAZON")
        return SERVICE_PRIORITY.get(service, 0)

    best_prefix = max(matching_prefixes, key=get_priority)
    return best_prefix

def get_aws_service_info(ip: str) -> Optional[Dict[str, Any]]:
    """
    Get AWS service information for a given IP address.

    Returns:
        Dictionary with AWS service details or None if IP is not AWS
    """
    try:
        # Validate IP address
        ipaddress.ip_address(ip)
    except ValueError:
        return None

    aws_ranges = get_aws_ip_ranges()
    prefixes = aws_ranges.get("prefixes", [])

    # Find all matching prefixes
    all_matching_prefixes = _find_all_matching_prefixes(ip, prefixes)
    if not all_matching_prefixes:
        return None

    # Find the best matching prefix (prioritizing specific services over AMAZON)
    best_prefix = _find_best_matching_prefix(ip, prefixes)
    if not best_prefix:
        return None

    service = best_prefix.get("service", "AMAZON")
    region = best_prefix.get("region")
    network_border_group = best_prefix.get("network_border_group", region)

    # Determine service category
    service_category = AWS_SERVICE_CATEGORIES.get(service, "Other AWS Services")

    # Collect all possible services from all matching prefixes (excluding AMAZON)
    all_services = set()
    for prefix in all_matching_prefixes:
        prefix_service = prefix.get("service", "AMAZON")
        if prefix_service != "AMAZON":
            all_services.add(prefix_service)

    # Convert to sorted list, use heuristic if no specific services found
    possible_services = sorted(list(all_services)) if all_services else _get_possible_services_for_prefix(service, region)

    return {
        "prefix": best_prefix.get("ip_prefix"),
        "region": region,
        "service": service,
        "service_category": service_category,
        "network_border_group": network_border_group,
        "possible_services": possible_services
    }

def _get_possible_services_for_prefix(service: str, region: str) -> Optional[List[str]]:
    """
    Determine possible specific AWS services for a given prefix.
    This is a heuristic approach based on service type and region.
    """
    if service == "AMAZON":
        # Generic AWS infrastructure - could be many services
        return ["EC2", "ELB", "NAT Gateway", "VPC Endpoints"]
    elif service == "EC2":
        return ["EC2 Instances", "ECS/EKS Nodes", "Batch Compute"]
    elif service == "S3":
        return ["S3 Buckets", "S3 Transfer Acceleration"]
    elif service == "RDS":
        return ["RDS Instances", "Aurora", "DocumentDB"]
    elif service == "ELASTICLOADBALANCING":
        return ["Application Load Balancer", "Network Load Balancer", "Gateway Load Balancer"]
    elif service == "CLOUDFRONT":
        return ["CloudFront Edge Locations"]
    elif service == "ROUTE53":
        return ["Route53 Resolver", "Route53 Health Checks"]
    else:
        return None

def detect_aws_infrastructure(ip: str) -> Dict[str, Any]:
    """
    Comprehensive AWS infrastructure detection for an IP address.

    Returns:
        Dictionary containing AWS detection results with metadata
    """
    aws_info = get_aws_service_info(ip)

    if not aws_info:
        return {
            "is_aws": False,
            "provider": None,
            "service_category": None,
            "aws": None
        }

    return {
        "is_aws": True,
        "provider": "AMAZON",
        "service_category": aws_info["service_category"],
        "aws": aws_info
    }

def refresh_aws_cache() -> None:
    """Force refresh of the AWS IP ranges cache."""
    _fetch_aws_ip_ranges()

def get_cache_status() -> Dict[str, Any]:
    """Get the current cache status for AWS IP ranges."""
    with _AWS_RANGES_LOCK:
        if not _AWS_RANGES_CACHE:
            return {
                "cached": False,
                "last_updated": None,
                "age_hours": None,
                "prefix_count": 0
            }

        cached_at = _AWS_RANGES_CACHE.get("cached_at")
        if cached_at:
            age = dt.datetime.utcnow() - cached_at
            age_hours = age.total_seconds() / 3600
        else:
            age_hours = None

        return {
            "cached": _is_cache_valid(),
            "last_updated": cached_at.isoformat() if cached_at else None,
            "age_hours": age_hours,
            "prefix_count": len(_AWS_RANGES_CACHE.get("prefixes", [])),
            "sync_token": _AWS_RANGES_CACHE.get("syncToken")
        }

__all__ = [
    "get_aws_ip_ranges",
    "get_aws_service_info",
    "detect_aws_infrastructure",
    "refresh_aws_cache",
    "get_cache_status"
]