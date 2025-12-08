# Availability Checker Dashboard

A professional web-based availability monitoring system that allows administrators to configure IP addresses and endpoints for scanning, while providing guests with a real-time dashboard to view availability status.

## Features

- **Admin Interface**: Secure authentication for administrators to manage scanning targets
- **Target Management**: Add, remove, and organize IP addresses and endpoints
- **Real-time Scanning**: Live availability checks with progress tracking
- **Guest Dashboard**: Public view of availability status for all configured targets
- **Professional UI**: Modern, responsive design with dark/light mode support
- **AI-Enhanced Scanning**: Optional AI-powered analysis and recommendations
- **Real-time Updates**: Live polling and progress indicators during scans

## Architecture

The system consists of:

1. **Frontend Dashboard** (Next.js/React) - Professional web interface
2. **Scanner Service** (FastAPI/Python) - Handles actual availability checks
3. **Local Storage** - Frontend data persistence for targets and scan history

## Quick Start

### 1. Scanner Service Setup

First, ensure your scanner service is running:

```bash
# Navigate to your scanner service directory
cd scanner

# Install dependencies
pip install -r requirements.txt

# Start the scanner service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Dashboard Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 3. Initial Configuration

1. Open your browser and navigate to `http://localhost:3000/setup`
2. Enter your scanner service URL (default: `http://localhost:8000`)
3. Test the connection and complete setup

### 4. First Login

1. Navigate to `http://localhost:3000/login`
2. Use the default credentials or create new ones
3. Access the admin dashboard at `/admin`

## API Endpoints

The frontend integrates with your scanner service using these endpoints:

### Scan Initiation
```http
POST /scan
Content-Type: application/json

{
  "ip_addresses": ["8.8.8.8", "1.1.1.1"],
  "endpoints": ["example.com"],
  "generate_ai_summary": true
}
```

### AI-Enhanced Scanning
```http
POST /ai-agent
Content-Type: application/json

{
  "ip_addresses": ["8.8.8.8"],
  "endpoints": ["example.com"],
  "generate_ai_summary": true
}
```

### Scan Status
```http
GET /scan/{token}
Accept: application/json
```

### Response Format
```json
{
  "token": "cc468a44fb9742e48d8087a861695d0f",
  "total_targets": 20,
  "completed_targets": 18,
  "status": "running",
  "mode": "standard",
  "started_at": "2025-12-04T20:52:59.129587",
  "finished_at": null,
  "results": [
    {
      "target": "8.8.8.8",
      "ip_address": "8.8.8.8",
      "availability": true,
      "location": "Mountain View, California",
      "country": "United States",
      "provider": "Google LLC",
      "service_category": "DNS",
      "publicly_exposed": true,
      "open_ports": [53],
      "accessibility_tests": [
        {
          "port": 53,
          "service": "DNS",
          "status": "open"
        }
      ],
      "risk_level": "low",
      "risk_summary": "Standard public DNS service",
      "recommendation": "Normal DNS service configuration"
    }
  ]
}
```

## Usage Guide

### For Administrators

1. **Login**: Access `/login` with admin credentials
2. **Manage Targets**: 
   - Add IP addresses in the "IP Addresses" section
   - Add endpoints in the "Endpoints" section
   - Use descriptions to organize targets
3. **Start Scans**:
   - Choose between Standard and AI-enhanced scanning
   - Monitor real-time progress
   - View detailed results with location, provider, and risk analysis

### For Guests

- **Public Dashboard**: Access `/` to view current availability status
- **Real-time Updates**: See live progress during active scans
- **Availability Statistics**: Monitor uptime percentages and success rates

## Configuration

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Scanner Service Configuration

Ensure your scanner service supports the following features:

1. **Port Scanning**: Detect open ports on target systems
2. **DNS Resolution**: Resolve domain names to IP addresses
3. **Geographic Detection**: Identify server locations and providers
4. **Risk Assessment**: Provide security recommendations
5. **AI Integration**: Optional Gemini API integration for enhanced analysis

## Development

### Frontend Structure

```
frontend/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── ScanResults.tsx # Results display component
│   └── ...
├── pages/              # Next.js pages
│   ├── admin/          # Admin dashboard
│   ├── setup.tsx       # Initial configuration
│   └── index.tsx       # Guest dashboard
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and API calls
└── styles/             # Global styles
```

### Key Components

- **TargetManagement**: IP and endpoint CRUD operations
- **ScanInitiator**: Scan configuration and initiation
- **ScanResults**: Real-time results display with live updates
- **Navbar**: Navigation with theme switching

### Real-time Features

- **Live Polling**: Automatic status updates every 3 seconds during scans
- **Progress Indicators**: Visual feedback for scan progress
- **Last Updated Timestamps**: Shows when data was last refreshed
- **Status Badges**: Color-coded availability indicators

## Security Considerations

1. **Admin Access**: Protected routes require authentication
2. **API Security**: Scanner service should implement proper authentication
3. **Data Validation**: Input validation for IP addresses and endpoints
4. **Rate Limiting**: Implement rate limiting on scan requests
5. **Error Handling**: Graceful error handling and user feedback

## Deployment

### Production Build

```bash
# Build the frontend
cd frontend
npm run build

# Start production server
npm run start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

## Troubleshooting

### Common Issues

1. **Scanner Connection Failed**
   - Verify scanner service is running on correct port
   - Check firewall settings
   - Ensure CORS is configured properly

2. **Scan Not Starting**
   - Verify at least one target is configured
   - Check scanner service logs for errors
   - Ensure API endpoints are accessible

3. **Real-time Updates Not Working**
   - Verify polling interval configuration
   - Check browser console for errors
   - Ensure scanner service returns proper status

### Logs

- Frontend logs: Check browser console
- Scanner logs: Check scanner service console output
- Network logs: Monitor API requests in browser dev tools

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review scanner service documentation
3. Open an issue with detailed error information
4. Include logs and configuration details