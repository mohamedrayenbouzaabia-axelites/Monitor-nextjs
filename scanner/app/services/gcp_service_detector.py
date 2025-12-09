"""Google Cloud Platform IP ranges and service detection module."""
from __future__ import annotations

import datetime as dt
import ipaddress
import json
import threading
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urljoin

import httpx

# Cache for GCP IP ranges data
_GCP_RANGES_CACHE: Dict[str, Any] = {}
_GCP_RANGES_LOCK = threading.Lock()
_CACHE_EXPIRY_HOURS = 6  # Refresh GCP IP ranges every 6 hours

# GCP service to category mapping
GCP_SERVICE_CATEGORIES = {
    "Google Cloud": "Cloud Infrastructure",
    "Google Workspace": "Productivity & Collaboration",
    "Google APIs": "API Services",
    "Google Ads": "Advertising & Marketing",
    "Google Cloud CDN": "CDN & Content Delivery",
    "Google Search": "Search Services",
    "Google Maps": "Location & Mapping",
    "Google Drive": "Storage & Collaboration",
    "Google Cloud Storage": "Storage & Databases",
    "Google Compute Engine": "Compute Services",
    "Google Kubernetes Engine": "Container Orchestration",
    "Google Cloud Run": "Serverless Computing",
    "Google Cloud Functions": "Serverless Functions",
    "Google App Engine": "Platform as a Service",
    "Google Cloud SQL": "Storage & Databases",
    "Google BigQuery": "Analytics & Big Data",
    "Google Cloud Pub/Sub": "Messaging & Communication",
    "Google Cloud Load Balancing": "Networking & Content Delivery",
    "Google Cloud Armor": "Security & Protection",
    "Google Cloud VPC": "Networking & Content Delivery",
    "Google Cloud DNS": "Networking & Content Delivery",
    "Google Cloud Monitoring": "Management & Governance",
    "Google Cloud Logging": "Management & Governance",
    "Google Cloud Identity": "Security & Identity",
    "Google Cloud IAM": "Security & Identity",
    "Google Cloud KMS": "Security & Identity",
    "Google Cloud Secret Manager": "Security & Identity",
    "Google Cloud Dataflow": "Data Processing",
    "Google Cloud Dataproc": "Big Data Processing",
    "Google Cloud AI Platform": "Artificial Intelligence",
    "Google Cloud Vertex AI": "Artificial Intelligence",
    "Google Cloud AutoML": "Artificial Intelligence",
    "Google Cloud Speech-to-Text": "Artificial Intelligence",
    "Google Cloud Text-to-Speech": "Artificial Intelligence",
    "Google Cloud Translation": "Artificial Intelligence",
    "Google Cloud Vision AI": "Artificial Intelligence",
    "Google Cloud Natural Language": "Artificial Intelligence",
    "Google Cloud Video Intelligence": "Artificial Intelligence",
    "Google Cloud Recommender": "Machine Learning",
    "Google Cloud Endpoints": "API Management",
    "Google Cloud Apigee": "API Management",
    "Google Cloud IoT": "Internet of Things",
    "Google Cloud Asset": "Resource Management",
    "Google Cloud OS Login": "Security & Identity",
    "Google Cloud BeyondCorp": "Security & Access",
    "Google Cloud Certificate Manager": "Security & Identity",
    "Google Cloud Web Security Scanner": "Security & Testing",
    "Google Cloud Binary Authorization": "Security & Compliance",
    "Google Cloud Security Command Center": "Security & Management",
    "Google Cloud Forseti": "Security & Compliance"
}

def _is_cache_valid() -> bool:
    """Check if the GCP IP ranges cache is still valid."""
    if not _GCP_RANGES_CACHE:
        return False

    cached_at = _GCP_RANGES_CACHE.get("cached_at")
    if not cached_at:
        return False

    age = dt.datetime.utcnow() - cached_at
    return age.total_seconds() < (_CACHE_EXPIRY_HOURS * 3600)

def _fetch_gcp_ip_ranges() -> Dict[str, Any]:
    """Fetch the latest GCP IP ranges from the official JSON endpoint."""
    url = "https://www.gstatic.com/ipranges/cloud.json"

    with httpx.Client(timeout=30.0) as client:
        response = client.get(url)
        response.raise_for_status()

        data = response.json()

        # Cache the data with timestamp
        with _GCP_RANGES_LOCK:
            _GCP_RANGES_CACHE.update({
                "syncToken": data.get("syncToken"),
                "creationTime": data.get("creationTime"),
                "prefixes": data.get("prefixes", []),
                "cached_at": dt.datetime.utcnow()
            })

        return data

def get_gcp_ip_ranges() -> Dict[str, Any]:
    """Get GCP IP ranges, using cache if available and valid."""
    with _GCP_RANGES_LOCK:
        if _is_cache_valid():
            return {
                "syncToken": _GCP_RANGES_CACHE["syncToken"],
                "creationTime": _GCP_RANGES_CACHE["creationTime"],
                "prefixes": _GCP_RANGES_CACHE["prefixes"]
            }

    # Cache is stale or empty, fetch fresh data
    return _fetch_gcp_ip_ranges()

def _ip_to_integer(ip: str) -> int:
    """Convert IP address to integer for comparison."""
    return int(ipaddress.ip_address(ip))

def _find_matching_gcp_prefix(ip: str, prefixes: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
    """Find the GCP prefix that matches the given IP address."""
    ip_int = _ip_to_integer(ip)

    for prefix in prefixes:
        # Check both ipv4Prefix and ipv6Prefix
        for prefix_key in ["ipv4Prefix", "ipv6Prefix"]:
            ip_prefix = prefix.get(prefix_key)
            if not ip_prefix:
                continue

            try:
                network = ipaddress.ip_network(ip_prefix, strict=False)
                if ip_int in range(_ip_to_integer(str(network.network_address)),
                                 _ip_to_integer(str(network.broadcast_address)) + 1):
                    return prefix
            except ValueError:
                # Skip invalid CIDR blocks
                continue

    return None

def get_gcp_service_info(ip: str) -> Optional[Dict[str, Any]]:
    """
    Get GCP service information for a given IP address.

    Returns:
        Dictionary with GCP service details or None if IP is not GCP
    """
    try:
        # Validate IP address
        ipaddress.ip_address(ip)
    except ValueError:
        return None

    gcp_ranges = get_gcp_ip_ranges()
    prefixes = gcp_ranges.get("prefixes", [])

    # Find matching prefix
    matching_prefix = _find_matching_gcp_prefix(ip, prefixes)
    if not matching_prefix:
        return None

    service = matching_prefix.get("service", "Google Cloud")
    scope = matching_prefix.get("scope", "global")

    # Determine service category
    service_category = GCP_SERVICE_CATEGORIES.get(service, "Other Google Services")

    # Extract region information from scope
    region = None
    if scope and scope != "global":
        region = scope

    # Try to determine possible services based on service and region
    possible_services = _get_possible_services_for_prefix(service, scope)

    # Determine the IP prefix
    ip_prefix = matching_prefix.get("ipv4Prefix") or matching_prefix.get("ipv6Prefix")

    return {
        "prefix": ip_prefix,
        "region": region,
        "service": service,
        "service_category": service_category,
        "scope": scope,
        "possible_services": possible_services
    }

def _get_possible_services_for_prefix(service: str, scope: str) -> Optional[List[str]]:
    """
    Determine possible specific GCP services for a given prefix.
    This is a heuristic approach based on service type and scope.
    """
    if service == "Google Cloud":
        # Generic Google Cloud infrastructure - could be many services
        return ["Compute Engine", "Cloud Storage", "Cloud Load Balancer", "Cloud CDN", "VPC Network"]
    elif service == "Google Cloud Storage":
        return ["Cloud Storage Buckets", "Cloud Storage Object Versioning", "Cloud Storage Lifecycle Management"]
    elif "Google Cloud SQL" in scope or scope and "sql" in scope.lower():
        return ["Cloud SQL MySQL", "Cloud SQL PostgreSQL", "Cloud SQL SQL Server"]
    elif "Google Compute Engine" in scope or scope and "compute" in scope.lower():
        return ["Compute Engine VMs", "Compute Engine Instance Templates", "Compute Engine Managed Instance Groups"]
    elif "Google Kubernetes Engine" in scope or scope and "gke" in scope.lower():
        return ["GKE Clusters", "GKE Autopilot", "GKE Gateway", "GKE Service Mesh"]
    elif "Google Cloud Run" in scope or scope and "run" in scope.lower():
        return ["Cloud Run Services", "Cloud Run Jobs", "Cloud Revisions"]
    elif "Google Cloud Functions" in scope or scope and "functions" in scope.lower():
        return ["Cloud Functions", "Cloud Functions Triggers", "Cloud Functions Eventarc"]
    elif "Google BigQuery" in scope or scope and "bigquery" in scope.lower():
        return ["BigQuery Datasets", "BigQuery Tables", "BigQuery Jobs", "BigQuery ML"]
    else:
        return None

def detect_gcp_infrastructure(ip: str) -> Dict[str, Any]:
    """
    Comprehensive GCP infrastructure detection for an IP address.

    Returns:
        Dictionary containing GCP detection results with metadata
    """
    gcp_info = get_gcp_service_info(ip)

    if not gcp_info:
        return {
            "is_gcp": False,
            "provider": None,
            "service_category": None,
            "gcp": None
        }

    return {
        "is_gcp": True,
        "provider": "GOOGLE",
        "service_category": gcp_info["service_category"],
        "gcp": gcp_info
    }

def refresh_gcp_cache() -> None:
    """Force refresh of the GCP IP ranges cache."""
    _fetch_gcp_ip_ranges()

def get_cache_status() -> Dict[str, Any]:
    """Get the current cache status for GCP IP ranges."""
    with _GCP_RANGES_LOCK:
        if not _GCP_RANGES_CACHE:
            return {
                "cached": False,
                "last_updated": None,
                "age_hours": None,
                "prefix_count": 0
            }

        cached_at = _GCP_RANGES_CACHE.get("cached_at")
        if cached_at:
            age = dt.datetime.utcnow() - cached_at
            age_hours = age.total_seconds() / 3600
        else:
            age_hours = None

        return {
            "cached": _is_cache_valid(),
            "last_updated": cached_at.isoformat() if cached_at else None,
            "age_hours": age_hours,
            "prefix_count": len(_GCP_RANGES_CACHE.get("prefixes", [])),
            "sync_token": _GCP_RANGES_CACHE.get("syncToken")
        }

__all__ = [
    "get_gcp_ip_ranges",
    "get_gcp_service_info",
    "detect_gcp_infrastructure",
    "refresh_gcp_cache",
    "get_cache_status"
]