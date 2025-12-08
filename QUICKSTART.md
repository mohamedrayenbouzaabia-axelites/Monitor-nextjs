# 🎯 QUICK START - Run Everything Command

## The One-Command Solution

**Run this single command to start everything:**

```bash
./start.sh
```

That's it! This will:
- ✅ Check all dependencies (Python, Node.js, npm)
- ✅ Setup Python virtual environment
- ✅ Install all required packages
- ✅ Start scanner service on port 8000
- ✅ Start frontend dashboard on port 3000
- ✅ Wait for services to be ready
- ✅ Show you the access URLs

## Alternative Commands

If you want more control, use these:

```bash
# Start everything (same as above)
./start.sh start

# Check what's running
./start.sh status

# Stop everything
./start.sh stop

# View logs
./start.sh logs

# Restart everything
./start.sh restart

# Setup only (don't start)
./start.sh setup
```

## After Running the Command

1. **Wait for completion** - The script will show progress and wait for services to start
2. **Access your dashboard** - Open http://localhost:3000 in your browser
3. **Run initial setup** - Go to http://localhost:3000/setup to configure your scanner
4. **Login as admin** - Use http://localhost:3000/login

## What Gets Started

- **Scanner Service**: FastAPI backend running on http://localhost:8000
- **Frontend Dashboard**: Next.js web interface on http://localhost:3000
- **Real-time Updates**: Automatic polling and live status updates

## Need Help?

```bash
./start.sh help
```

This shows all available commands and options.