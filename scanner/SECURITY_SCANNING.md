# Security Scanning Documentation

## Overview

This document describes the legitimate security scanning capabilities integrated into the Availability Checker platform. The system includes Nmap for network scanning and Nikto for web vulnerability scanning, with proper authorization, rate limiting, and legal compliance features.

## 🔐 Legal Requirements & Compliance

### ⚠️ IMPORTANT LEGAL NOTICE

**Only scan targets you own or have explicit written permission to scan.** Unauthorized scanning may be illegal and unethical.

### Authorization Requirements

1. **Consent Required**: All scans require explicit consent confirmation
2. **Ownership Verification**: Only scan networks you own or have permission to test
3. **Rate Limiting**: Maximum 10 scans per hour per user
4. **Audit Logging**: All scans are logged for compliance and audit purposes
5. **Responsible Use**: Use results for legitimate security testing only

### Authorized Network Ranges

By default, the system only allows scanning of:
- `127.0.0.0/8` (localhost)
- `10.0.0.0/8` (private class A)
- `172.16.0.0/12` (private class B)
- `192.168.0.0/16` (private class C)

## 🛡️ Security Features

### Rate Limiting
- **Maximum**: 10 scans per hour per user
- **Enforcement**: Hard limits with user tracking
- **Bypass**: Not available for security reasons

### Authentication
- **JWT-based**: Secure token authentication required
- **User Tracking**: All scans linked to authenticated users
- **Session Management**: Token expiration and renewal

### Audit Trail
- **Complete Logging**: Every scan request and result logged
- **User Attribution**: All actions tracked to authenticated users
- **Timestamps**: Precise timing for compliance requirements
- **Consent Records**: Legal consent captured and stored

## 🚀 API Endpoints

### Authentication Required
All security scanning endpoints require valid JWT authentication.

#### 1. Get Scan Information
```http
GET /security-scan/scan-info
```
Returns information about available scan types and legal requirements.

#### 2. Initiate Security Scan
```http
POST /security-scan/initiate
Authorization: Bearer <jwt_token>

{
  "target": "192.168.1.1",
  "scan_type": "comprehensive",
  "scan_options": {},
  "consent": true,
  "purpose": "Security assessment"
}
```

#### 3. Check Scan Status
```http
GET /security-scan/status/{scan_id}
Authorization: Bearer <jwt_token>
```

#### 4. Get Scan Results
```http
GET /security-scan/results/{scan_id}
Authorization: Bearer <jwt_token>
```

#### 5. List User Scans
```http
GET /security-scan/my-scans
Authorization: Bearer <jwt_token>
```

#### 6. Delete Scan Record
```http
DELETE /security-scan/scan/{scan_id}
Authorization: Bearer <jwt_token>
```

## 🔧 Scan Types

### 1. Nmap Scanning
**Purpose**: Network port scanning and service detection

**Capabilities**:
- Port scanning (TCP/UDP)
- Service version detection
- OS fingerprinting (stealth mode)
- Open port identification
- Service enumeration

**Default Options**:
- SYN scan (stealthy)
- Fast scan mode
- First 1000 ports
- 5-minute timeout
- Limited retries

### 2. Nikto Scanning
**Purpose**: Web server vulnerability assessment

**Capabilities**:
- Web vulnerability detection
- Server version checking
- Security misconfigurations
- Common web vulnerabilities
- SSL/TLS configuration issues

**Default Options**:
- Skip static checks (faster)
- 5-minute timeout
- JSON output format
- Non-interactive mode

### 3. Comprehensive Scanning
**Purpose**: Complete security assessment

**Capabilities**:
- All Nmap capabilities
- All Nikto capabilities
- Correlated analysis
- Risk assessment
- Remediation recommendations

## 📊 Scan Results

### Result Structure

```json
{
  "scan_id": "scan_20241208_143022_user123",
  "target": "192.168.1.1",
  "scan_timestamp": "2024-12-08T14:30:22.123Z",
  "status": "completed",
  "nmap_scan": {
    "target": "192.168.1.1",
    "scan_type": "nmap",
    "status": "completed",
    "open_ports": [22, 80, 443],
    "services": {
      "22/tcp": {"service": "SSH", "protocol": "tcp"},
      "80/tcp": {"service": "HTTP", "protocol": "tcp"},
      "443/tcp": {"service": "HTTPS", "protocol": "tcp"}
    },
    "vulnerabilities": [],
    "scan_duration": 45.2
  },
  "nikto_scan": {
    "target": "192.168.1.1",
    "scan_type": "nikto",
    "status": "completed",
    "web_vulnerabilities": [
      {
        "name": "Apache Version",
        "description": "Apache/2.4.41 appears to be outdated",
        "severity": "medium"
      }
    ]
  },
  "combined_analysis": {
    "overall_risk": "medium",
    "total_vulnerabilities": 3,
    "open_services": 3,
    "critical_findings": [],
    "recommendations": [
      "Review and address identified vulnerabilities",
      "Update web server software",
      "Review open ports and close unnecessary ones"
    ]
  },
  "legal_compliance": {
    "authorized": true,
    "consent_given": true,
    "scan_scope_legitimate": true,
    "rate_limit_respected": true,
    "scan_duration_total": 125.7
  }
}
```

### Risk Classification

- **High**: Critical vulnerabilities, remote code execution, privilege escalation
- **Medium**: XSS, SQL injection, CSRF, directory traversal
- **Low**: Information disclosure, version information, configuration issues
- **Info**: General information, banners, headers

## 🛠️ Installation & Setup

### System Requirements

1. **Nmap**: Network scanning tool
   ```bash
   # Ubuntu/Debian
   sudo apt-get install nmap

   # CentOS/RHEL
   sudo yum install nmap
   ```

2. **Nikto**: Web vulnerability scanner
   ```bash
   # Ubuntu/Debian
   sudo apt-get install nikto

   # CentOS/RHEL
   sudo yum install nikto

   # Or install from source
   git clone https://github.com/sullo/nikto.git
   cd nikto/program
   perl nikto.pl
   ```

### Python Dependencies

```bash
pip install python-nmap aiofiles psutil
```

### Configuration

Environment variables (`.env`):
```env
# Security scanning settings
SECURITY_SCAN_ENABLED=true
MAX_SCANS_PER_HOUR=10
SCAN_TIMEOUT_SECONDS=300

# Authorized networks (comma-separated)
AUTHORIZED_NETWORKS=127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16

# JWT settings
SECRET_KEY=your-super-secret-jwt-key
JWT_EXPIRATION_DAYS=1
```

## 🔍 Usage Examples

### Example 1: Basic Network Scan
```bash
curl -X POST "http://localhost:8000/security-scan/initiate" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "192.168.1.1",
    "scan_type": "nmap",
    "consent": true,
    "purpose": "Internal security assessment"
  }'
```

### Example 2: Web Vulnerability Scan
```bash
curl -X POST "http://localhost:8000/security-scan/initiate" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "example.com",
    "scan_type": "nikto",
    "consent": true,
    "purpose": "Web application security testing"
  }'
```

### Example 3: Comprehensive Scan
```bash
curl -X POST "http://localhost:8000/security-scan/initiate" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "192.168.1.100",
    "scan_type": "comprehensive",
    "consent": true,
    "purpose": "Complete security assessment",
    "scan_options": {
      "nmap": {
        "-p": "1-65535"
      },
      "nikto": {
        "-Tuning": "1"
      }
    }
  }'
```

## 🚨 Security Considerations

### Safe Scanning Practices

1. **Stealth Mode**: Use SYN scans instead of connect scans
2. **Rate Limiting**: Limit concurrent connections and request rates
3. **Timeouts**: Set reasonable timeouts to avoid network disruption
4. **Scope Limitation**: Scan only necessary ports and services
5. **Documentation**: Document purpose and authorization for all scans

### Network Impact

- **Nmap**: Low to moderate network impact
- **Nikto**: Moderate web server load
- **Comprehensive**: Higher impact but still within safe limits

### Resource Usage

- **CPU**: Moderate during scans
- **Memory**: Low to moderate usage
- **Network**: Proportional to scan scope
- **Storage**: Results stored temporarily (configurable)

## 📝 Monitoring & Logging

### Logs Location
- **Application logs**: Scanner service logs
- **Audit logs**: All scan attempts and results
- **Error logs**: Failed scans and system errors

### Metrics to Monitor
- Scan success rate
- Average scan duration
- Rate limiting violations
- Authentication failures
- System resource usage

## 🔄 Maintenance

### Regular Tasks

1. **Update Tools**: Keep Nmap and Nikto updated
2. **Review Logs**: Monitor for abuse or unauthorized access
3. **Cleanup**: Remove old scan records based on retention policy
4. **Security Updates**: Apply security patches to scanning tools

### Troubleshooting

Common issues:
- **Tool not found**: Install Nmap/Nikto
- **Permission denied**: Check file permissions and user access
- **Timeout**: Increase scan timeout or adjust scan scope
- **Rate limits**: Wait for rate limit reset or request increase

## 📞 Support

For issues related to:
- **Technical problems**: Check logs and configuration
- **Security concerns**: Contact security team immediately
- **Legal questions**: Consult legal department
- **Feature requests**: Submit through proper channels

## 📚 Additional Resources

- [Nmap Documentation](https://nmap.org/book/)
- [Nikto Documentation](https://github.com/sullo/nikto/wiki)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Legal Considerations](https://www.eff.org/issues/coding/)

---

**Last Updated**: December 8, 2024
**Version**: 2.0.0
**Maintainer**: Security Team