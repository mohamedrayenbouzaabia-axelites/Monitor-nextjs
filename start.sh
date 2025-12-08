#!/bin/bash

# Availability Checker - One-Command Startup Script
# This script starts both the scanner service and frontend dashboard

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.7+ to continue."
        exit 1
    fi
    print_success "Python 3 found: $(python3 --version)"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ to continue."
        exit 1
    fi
    print_success "Node.js found: $(node --version)"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm to continue."
        exit 1
    fi
    print_success "npm found: $(npm --version)"
}

# Setup scanner service
setup_scanner() {
    print_status "Setting up scanner service..."
    
    cd scanner
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    cd ..
    print_success "Scanner service setup complete"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend dashboard..."
    
    cd frontend
    
    # Install npm dependencies
    print_status "Installing npm dependencies..."
    npm install
    
    cd ..
    print_success "Frontend setup complete"
}

# Start scanner service in background
start_scanner() {
    print_status "Starting scanner service..."

    # Kill any existing process on port 8000
    if lsof -i :8000 > /dev/null 2>&1; then
        print_warning "Killing existing process on port 8000"
        kill -9 $(lsof -ti:8000) 2>/dev/null || true
        sleep 1
    fi

    cd scanner
    source venv/bin/activate

    # Start scanner service in background
    nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../scanner.log 2>&1 &
    SCANNER_PID=$!
    echo $SCANNER_PID > ../scanner.pid

    cd ..

    print_success "Scanner service started (PID: $SCANNER_PID)"
    print_status "Scanner service logs: scanner.log"
}

# Start frontend in background
start_frontend() {
    print_status "Starting frontend dashboard..."

    # Kill any existing process on port 3000
    if lsof -i :3000 > /dev/null 2>&1; then
        print_warning "Killing existing process on port 3000"
        kill -9 $(lsof -ti:3000) 2>/dev/null || true
        sleep 1
    fi

    cd frontend

    # Start frontend in background
    export PORT=3000
    nohup npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid

    cd ..

    print_success "Frontend dashboard started (PID: $FRONTEND_PID)"
    print_status "Frontend logs: frontend.log"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to start..."
    
    # Wait for scanner service
    for i in {1..30}; do
        if curl -s http://localhost:8000/scan > /dev/null 2>&1; then
            print_success "Scanner service is ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Scanner service may still be starting. Check scanner.log for details."
        fi
        sleep 2
    done
    
    # Wait for frontend
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Frontend dashboard is ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Frontend may still be starting. Check frontend.log for details."
        fi
        sleep 2
    done
}

# Display usage information
show_usage() {
    echo -e "${BLUE}Availability Checker - Startup Script${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start both scanner service and frontend dashboard"
    echo "  stop      Stop all running services"
    echo "  restart   Restart all services"
    echo "  status    Show status of all services"
    echo "  logs      Show recent logs from both services"
    echo "  setup     Setup dependencies only (no start)"
    echo "  help      Show this help message"
    echo ""
    echo "Default: If no command is specified, 'start' is used"
    echo ""
}

# Stop all services
stop_services() {
    print_status "Stopping all services..."
    
    # Stop scanner service
    if [ -f "scanner.pid" ]; then
        SCANNER_PID=$(cat scanner.pid)
        if kill -0 $SCANNER_PID 2>/dev/null; then
            kill $SCANNER_PID
            rm scanner.pid
            print_success "Scanner service stopped"
        else
            print_warning "Scanner service was not running"
            rm -f scanner.pid
        fi
    fi
    
    # Stop frontend
    if [ -f "frontend.pid" ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            rm frontend.pid
            print_success "Frontend dashboard stopped"
        else
            print_warning "Frontend dashboard was not running"
            rm -f frontend.pid
        fi
    fi
}

# Show status of services
show_status() {
    echo -e "${BLUE}Service Status:${NC}"
    echo ""
    
    # Check scanner service - first by PID file, then by port check
    SCANNER_RUNNING=false
    if [ -f "scanner.pid" ]; then
        SCANNER_PID=$(cat scanner.pid)
        if kill -0 $SCANNER_PID 2>/dev/null; then
            echo -e "Scanner Service: ${GREEN}Running${NC} (PID: $SCANNER_PID)"
            SCANNER_RUNNING=true
        else
            rm -f scanner.pid
        fi
    fi
    
    # If not running via PID, check by port
    if [ "$SCANNER_RUNNING" = false ]; then
        if lsof -i :8000 > /dev/null 2>&1; then
            SCANNER_PID=$(lsof -ti:8000)
            echo -e "Scanner Service: ${GREEN}Running${NC} (PID: $SCANNER_PID - detected by port)"
            SCANNER_RUNNING=true
        else
            echo -e "Scanner Service: ${RED}Stopped${NC}"
        fi
    fi
    
    if [ "$SCANNER_RUNNING" = true ]; then
        echo "  URL: http://localhost:8000"
        
        # Test if scanner is actually responding
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/scan | grep -q "405\|400\|200"; then
            echo "  Status: ${GREEN}Responding${NC}"
        else
            echo "  Status: ${YELLOW}Port open but not responding correctly${NC}"
        fi
    fi
    
    echo ""
    
    # Check frontend - first by PID file, then by port check
    FRONTEND_RUNNING=false
    if [ -f "frontend.pid" ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "Frontend Dashboard: ${GREEN}Running${NC} (PID: $FRONTEND_PID)"
            FRONTEND_RUNNING=true
        else
            rm -f frontend.pid
        fi
    fi
    
    # If not running via PID, check by port
    if [ "$FRONTEND_RUNNING" = false ]; then
        if lsof -i :3000 > /dev/null 2>&1; then
            FRONTEND_PID=$(lsof -ti:3000)
            echo -e "Frontend Dashboard: ${GREEN}Running${NC} (PID: $FRONTEND_PID - detected by port)"
            FRONTEND_RUNNING=true
        else
            echo -e "Frontend Dashboard: ${RED}Stopped${NC}"
        fi
    fi
    
    if [ "$FRONTEND_RUNNING" = true ]; then
        echo "  URL: http://localhost:3000"
        
        # Test if frontend is actually responding
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
            echo "  Status: ${GREEN}Responding${NC}"
        else
            echo "  Status: ${YELLOW}Port open but not responding correctly${NC}"
        fi
    fi
    
    echo ""
    
    # Overall system status
    if [ "$SCANNER_RUNNING" = true ] && [ "$FRONTEND_RUNNING" = true ]; then
        echo -e "${GREEN}🎉 System Status: FULLY OPERATIONAL${NC}"
        echo -e "${BLUE}Ready to use!${NC}"
    elif [ "$SCANNER_RUNNING" = true ] || [ "$FRONTEND_RUNNING" = true ]; then
        echo -e "${YELLOW}⚠️  System Status: PARTIAL OPERATION${NC}"
        echo -e "${YELLOW}Some services may need attention${NC}"
    else
        echo -e "${RED}❌ System Status: OFFLINE${NC}"
        echo -e "${RED}Run './start.sh start' to begin${NC}"
    fi
}

# Show logs
show_logs() {
    echo -e "${BLUE}Recent Scanner Service Logs:${NC}"
    echo "================================"
    if [ -f "scanner.log" ]; then
        tail -n 20 scanner.log
    else
        echo "No scanner logs found."
    fi
    
    echo ""
    echo -e "${BLUE}Recent Frontend Logs:${NC}"
    echo "=============================="
    if [ -f "frontend.log" ]; then
        tail -n 20 frontend.log
    else
        echo "No frontend logs found."
    fi
}

# Main script logic
main() {
    # Parse command line argument
    COMMAND=${1:-start}
    
    case $COMMAND in
        "start")
            print_status "Starting Availability Checker System..."
            # Stop any existing services first
            stop_services
            sleep 2
            check_python
            check_nodejs
            check_npm
            setup_scanner
            setup_frontend
            start_scanner
            start_frontend
            wait_for_services
            
            echo ""
            echo -e "${GREEN}🎉 Availability Checker is now running!${NC}"
            echo ""
            echo -e "${BLUE}Access your dashboard:${NC}"
            echo "  Frontend: ${GREEN}http://localhost:3000${NC}"
            echo "  Scanner:  ${GREEN}http://localhost:8000${NC}"
            echo ""
            echo -e "${BLUE}Quick Start:${NC}"
            echo "  1. Open http://localhost:3000/setup"
            echo "  2. Configure your scanner service URL"
            echo "  3. Login at http://localhost:3000/login"
            echo "  4. Start monitoring at http://localhost:3000/admin"
            echo ""
            echo -e "${BLUE}Management Commands:${NC}"
            echo "  Stop services: $0 stop"
            echo "  Check status:  $0 status"
            echo "  View logs:     $0 logs"
            echo ""
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            main start
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "setup")
            check_python
            check_nodejs
            check_npm
            setup_scanner
            setup_frontend
            print_success "Setup complete! Run '$0 start' to begin."
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
}

# Trap Ctrl+C and cleanup
trap 'print_warning "Shutdown requested..."; stop_services; exit 0' INT

# Run main function
main "$@"