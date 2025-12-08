"""Pydantic schemas shared across the IP intelligence service."""
from __future__ import annotations

import datetime as dt
from typing import List, Optional

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


class AccessibilityProbe(BaseModel):
    port: int
    service: str
    status: str


class TargetScanResult(BaseModel):
    target: str
    ip_address: str
    availability: bool
    location: Optional[str]
    country: Optional[str]
    provider: Optional[str]
    service_category: Optional[str]
    publicly_exposed: bool
    open_ports: List[int]
    accessibility_tests: List[AccessibilityProbe]
    risk_level: str
    risk_summary: str
    recommendation: Optional[str]


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
