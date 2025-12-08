IP Intelligence Scanner
=======================

The project provides an asynchronous-style FastAPI service that scans IPs or HTTP endpoints, enriches them with passive intelligence, and computes a risk assessment (optionally powered by Gemini). It exposes a small REST surface area intended for automation pipelines and compliance checks.


System Overview
---------------

- **FastAPI application (`app/main.py`)** – Hosts the HTTP interface, loads environment configuration, and wires routers.
- **Routing layer (`app/api/routes.py`)** – Defines `/scan` for standard scans, `/ai-agent` for AI-enabled scans, and `/scan/{token}` for consulting progress.
- **Scanner service (`app/services/scanner.py`)** – Resolves targets, runs port probes, fetches metadata, classifies risk, and orchestrates background jobs using a thread pool.
- **Persistence (`app/services/scan_store.py`)** – Persists finished jobs to SQLite so `/scan/{token}` can serve historical results.
- **Gemini integration (`app/services/gemini_client.py`)** – Wraps `google-genai` to turn scan outputs into AI-authored risk summaries and recommendations.

### Data Flow
1. A client POSTs a `ScanRequest` (IP addresses and/or endpoints).
2. The router enqueues each target via `queue_scan`, immediately returning a token.
3. Background workers resolve hostnames, gather metadata from `ip-api.com`, and probe common TCP ports.
4. Results are persisted incrementally in `SCAN_REGISTRY` and finally to SQLite under `data/scans.sqlite`.
5. The polling endpoint rehydrates the job (from memory or SQLite) and returns normalized `TargetScanResult` objects per target.


Key Features
------------
- Concurrent scanning across multiple targets with per-target worker pools.
- Passive reconnaissance via `ip-api.com` (country, region, ISP, hosting/proxy/mobile flags, etc.).
- Deterministic risk heuristics plus optional Gemini-powered summaries and recommendations.
- Durable job tracking so tokens remain queryable after the process restarts.
- Tidy Pydantic schemas for request/response validation and FastAPI documentation.


Getting Started
---------------

1. **Clone & install dependencies**
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Set environment variables**
   - `GEMINI_API_KEY`: required for AI assessments; omit to rely solely on deterministic risk output.
3. **Run the API**
   uvicorn app.main:app --reload

4. **Execute a scan**
   curl -X POST http://localhost:8000/scan \
     -H "Content-Type: application/json" \
     -d '{"ip_addresses": ["8.8.8.8"], "generate_ai_summary": true}'
   Poll `/scan/{token}` until `status` becomes `complete`.


API Surface
-----------
- `POST /scan` – Accepts `ScanRequest` (list of IPs/endpoints, optional `generate_ai_summary`). Returns `{token, status_url}`.
- `POST /ai-agent` – Same payload as `/scan` but marks the job mode as `ai` for tracking/reporting.
- `GET /scan/{token}` – Returns a `ScanProgressResponse` containing job status, timestamps, and ordered `TargetScanResult` entries.

Each `TargetScanResult` includes:
`target`, `ip_address`, `availability`, `location`, `country`, `provider`, `service_category`, `publicly_exposed`, `open_ports`, `accessibility_tests`, `risk_level`, `risk_summary`, `recommendation`.


Architecture Notes
------------------
- **Concurrency** – `ThreadPoolExecutor` handles both job scheduling and per-target work (bounded by `PER_TARGET_MAX_WORKERS`).
- **Port probing** – Synchronous socket connects with small timeouts across a curated `COMMON_PORTS` map, yielding lightweight accessibility data.
- **Metadata** – `httpx` fetches from `ip-api.com` with a 10s timeout. Failures bubble up as `risk_summary` messages so clients understand when resolution or HTTP calls fail.
- **Risk categorization** – AI-enabled jobs ask Gemini for JSON risk objects. Otherwise, heuristics flag exposure based on sensitive ports or broad surface area.
- **Persistence** – Completed jobs serialize to SQLite so redeployments or process restarts do not strand tokens. The store normalizes timestamps and Pydantic models automatically.


Maintenance & Operations
------------------------
- **Environment health**: At startup, logs report whether `GEMINI_API_KEY`, `GEMINI_MODEL`, and `SCAN_DB_PATH` are present. Verify these before enabling AI features.
- **Database hygiene**: Periodically rotate or vacuum `data/scans.sqlite` if the job table grows large. The file can be backed up or purged safely; unfinished jobs remain in memory (`SCAN_REGISTRY`).
- **Timeout tuning**: Set to 10s (DNS resolving)
- **Dependency upgrades**: Keep `fastapi`, `httpx`, and `google-genai` updated to benefit from security fixes. Review release notes for breaking changes before bumping versions.


Troubleshooting
---------------
- DNS failures yield `ip_address: "unknown"` with the resolver error inside `risk_summary`.
- `availability: false` with no `open_ports` means every probed port was closed.
- Missing `GEMINI_API_KEY` results in `"Gemini API key not configured"` summaries; set the key to re-enable AI.
- Use `SCAN_DB_PATH=/tmp/scans.sqlite` during development to avoid permission issues when running inside containers.

