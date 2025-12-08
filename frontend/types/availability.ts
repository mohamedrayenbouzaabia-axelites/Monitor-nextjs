export interface AccessibilityTest {
    port: number;
    service: string;
    status: 'open' | 'closed';
}

export interface TargetScanResult {
    target: string;
    ip_address: string;
    availability: boolean;
    location: string | null;
    country: string | null;
    provider: string | null;
    service_category: string | null;
    publicly_exposed: boolean;
    open_ports: number[];
    accessibility_tests: AccessibilityTest[];
    risk_level: string;
    risk_summary: string | null;
    recommendation: string | null;
}

export interface ScanProgressResponse {
    token: string;
    total_targets: number;
    completed_targets: number;
    status: 'running' | 'completed' | 'failed';
    mode: 'standard' | 'ai';
    started_at: string;
    finished_at: string | null;
    results: TargetScanResult[];
}

export interface ScanRequest {
    ip_addresses: string[];
    endpoints: string[];
    generate_ai_summary: boolean;
}

export interface ScanInitResponse {
    token: string;
    status_url: string;
    message: string;
}

export interface IPAddress {
    id: string;
    address: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface Endpoint {
    id: string;
    url: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface AvailabilityStats {
    total_targets: number;
    available_targets: number;
    unavailable_targets: number;
    success_rate: number;
}

export interface ScanHistory {
    id: string;
    token: string;
    created_at: string;
    status: 'running' | 'completed' | 'failed';
    total_targets: number;
    completed_targets: number;
    mode: 'standard' | 'ai';
}