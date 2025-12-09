"""Pydantic schemas shared across the IP intelligence service."""
from __future__ import annotations

import datetime as dt
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field, field_validator, model_validator


class ScanRequest(BaseModel):
    ip_addresses: Optional[List[str]] = Field(
        None, description="Raw IPv4/IPv6 addresses."
    )
    endpoints: Optional[List[str]] = Field(
        None,
        description="Application endpoints such as https://service.example.com/api.",
    )
    generate_ai_summary: bool = Field(
        True,
        description="Toggle Gemini-powered risk summary and recommendation generation.",
    )

    @field_validator("ip_addresses", "endpoints", mode="before")
    @classmethod
    def strip_and_validate(cls, value):
        if value is None:
            return value
        cleaned_items = []
        for item in value:
            cleaned = str(item).strip()
            if not cleaned:
                raise ValueError("Targets cannot be empty strings.")
            cleaned_items.append(cleaned)
        return cleaned_items

    @model_validator(mode="after")
    def require_at_least_one_target(self):
        if not self.ip_addresses and not self.endpoints:
            raise ValueError("Provide at least one IP address or endpoint.")
        return self


class AWSInfo(BaseModel):
    """AWS-specific information for IP addresses."""
    prefix: Optional[str] = None
    region: Optional[str] = None
    service: Optional[str] = None
    service_category: Optional[str] = None
    network_border_group: Optional[str] = None
    possible_services: Optional[List[str]] = None


class GCPInfo(BaseModel):
    """GCP-specific information for IP addresses."""
    prefix: Optional[str] = None
    region: Optional[str] = None
    service: Optional[str] = None
    service_category: Optional[str] = None
    scope: Optional[str] = None
    possible_services: Optional[List[str]] = None


class Metadata(BaseModel):
    """Extended metadata for scan results, including AWS and GCP information."""
    location: Optional[str] = None
    country: Optional[str] = None
    provider: Optional[str] = None
    service_category: Optional[str] = None
    aws: Optional[AWSInfo] = None
    gcp: Optional[GCPInfo] = None


class AccessibilityProbe(BaseModel):
    port: int
    service: str
    status: str


class TargetScanResult(BaseModel):
    target: str
    ip_address: str
    availability: bool
    metadata: Metadata
    publicly_exposed: bool
    open_ports: List[int]
    accessibility_tests: List[AccessibilityProbe]
    testing_techniques: List[str] = Field(default_factory=list)
    risk_level: str
    risk_summary: str
    recommendation: Optional[str] = None


class ScanProgressResponse(BaseModel):
    token: str
    total_targets: int
    completed_targets: int
    status: str
    mode: str = Field(
        ..., description="Indicates whether the job was a standard or AI-powered scan."
    )
    started_at: dt.datetime
    finished_at: Optional[dt.datetime]
    results: List[TargetScanResult]


__all__ = [
    "AccessibilityProbe",
    "ScanProgressResponse",
    "ScanRequest",
    "TargetScanResult",
]
