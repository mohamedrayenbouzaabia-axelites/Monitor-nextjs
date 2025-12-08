"""Gemini client responsible for AI-backed risk assessments."""
from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional

import httpx
from google import genai

logger = logging.getLogger(__name__)


class GeminiClient:
    "Wrapper around the google-genai client."

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-pro") -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = os.getenv("GEMINI_MODEL", model)
        self.client: Optional[genai.Client] = None
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)

    def _call_api(self, prompt: str) -> tuple[str, bool]:
        """Call Gemini API and return (response_text, is_rate_limited)."""
        if not self.client:
            return (
                "Gemini API key not configured. Set the GEMINI_API_KEY environment variable "
                "to enable AI-driven audit responses.",
                False
            )

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                },
            )
        except Exception as exc:  # pylint: disable=broad-except
            # Check if it's a rate limit error
            error_str = str(exc).lower()
            if "resource_exhausted" in error_str or "429" in error_str or "rate_limit" in error_str:
                logger.warning(f"Gemini API rate limit exceeded: {exc}")
                return f"Gemini API rate limit exceeded: {exc}", True
            logger.error(f"Gemini API call failed: {exc}")
            return f"Gemini API call failed: {exc}", False

        if getattr(response, "text", None):
            return response.text, False

        candidates: List[Any] = getattr(response, "candidates", []) or []
        if not candidates:
            return "Gemini API returned no candidates in the response.", False

        first_candidate = candidates[0]
        content = getattr(first_candidate, "content", None)
        parts = getattr(content, "parts", []) if content else []
        if not parts:
            return "Gemini response did not contain any text parts.", False
        # Each part has a .text attribute per google-genai.
        part_texts = [getattr(part, "text", "") for part in parts]
        combined = " ".join(t for t in part_texts if t).strip()
        return combined or "Gemini response missing textual content.", False

    def generate_risk_assessment(self, scan_result: Dict[str, Any]) -> Dict[str, Optional[str]]:
        """Generate a concise risk assessment from a full scan result."""
        prompt = self._build_risk_prompt(scan_result)
        raw_response, is_rate_limited = self._call_api(prompt)

        # If rate limited, return a special response indicating fallback should be used
        if is_rate_limited:
            return {
                "risk_level": None,  # Indicates fallback should be used
                "risk_summary": "rate_limited",
                "recommendation": None,
            }

        try:
            parsed = json.loads(raw_response)
        except json.JSONDecodeError:
            return {
                "risk_level": "unknown",
                "risk_summary": raw_response.strip(),
                "recommendation": None,
            }

        return {
            "risk_level": parsed.get("risk_level") or "unknown",
            "risk_summary": parsed.get("risk_summary") or parsed.get("summary"),
            "recommendation": parsed.get("recommendation") or parsed.get("recommendations"),
        }

    @staticmethod
    def _build_risk_prompt(scan_result: Dict[str, Any]) -> str:
        """Ask Gemini for a structured risk response."""
        serialized = json.dumps(scan_result, default=str)
        return (
            "You are a security risk assessor. "
            "Given the following scan result JSON, respond ONLY with a compact JSON object containing "
            'the keys: \"risk_level\" (one of: no risk, low, medium, high), '
            '\"risk_summary\" (1-2 sentences), and \"recommendation\" '
            "(a short remediation statement). Keep it concise.\n"
            f"Scan Result: {serialized}"
        )

__all__ = ["GeminiClient"]
