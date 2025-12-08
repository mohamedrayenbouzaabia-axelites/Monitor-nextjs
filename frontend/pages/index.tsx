import Layout from '../components/Layout'
import ScanResults from '../components/ScanResults'
import { useEffect, useState, useRef } from 'react'
import { ScanProgressResponse } from '../types/availability'
import { getScanStatus } from '../utils/api'
import { useTargetedPolling } from '../hooks/useTargetedPolling'
import Link from 'next/link'
import {
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  const [recentScan, setRecentScan] = useState<ScanProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastScanRef = useRef<ScanProgressResponse | null>(null)

  // Fetch scan data using targeted polling
  const fetchRecentScan = async () => {
    try {
      setLoading(true)
      setError(null)

      // First check for active scan
      const activeScanToken = localStorage.getItem('activeScanToken')
      if (activeScanToken) {
        try {
          const scanData = await getScanStatus(activeScanToken)

          // Only update state if data actually changed (prevents unnecessary re-renders)
          if (!lastScanRef.current ||
              JSON.stringify(lastScanRef.current) !== JSON.stringify(scanData)) {
            setRecentScan(scanData)
            lastScanRef.current = scanData
          }

          // If scan is complete or failed, also clear the active scan token
          if (scanData.status === 'complete' || scanData.status === 'failed') {
            localStorage.removeItem('activeScanToken')
            if (scanData.status === 'complete') {
              localStorage.setItem('lastScanToken', activeScanToken)
            }
            // Stop polling when scan completes
            stopPolling()
          }

          return
        } catch (error) {
          console.log('Active scan not available')
          localStorage.removeItem('activeScanToken')
        }
      }

      // Then check for last completed scan
      const lastScanToken = localStorage.getItem('lastScanToken')
      if (lastScanToken) {
        try {
          const scanData = await getScanStatus(lastScanToken)
          if (scanData.status === 'complete') {
            setRecentScan(scanData)
            lastScanRef.current = scanData
            return
          }
        } catch (error) {
          console.log('Last scan not available or expired')
        }
      }

      // No scan data available
      setRecentScan(null)
    } catch (error) {
      console.error('Error fetching scan data:', error)
      setError('Failed to load scan data')
    } finally {
      setLoading(false)
    }
  }

  // Use targeted polling only for scan status updates
  const { start: startPolling, stop: stopPolling } = useTargetedPolling(fetchRecentScan, {
    interval: 3000, // Poll every 3 seconds for better responsiveness
    enabled: false, // Start disabled, will enable when needed
    onStop: () => {
      console.log('Scan polling stopped')
    }
  })

  // Initial data fetch and start polling if there's an active scan
  useEffect(() => {
    const initializePolling = async () => {
      // Check for active scan before initial fetch
      const activeScanToken = localStorage.getItem('activeScanToken')

      // Perform initial fetch
      try {
        setLoading(true)
        setError(null)

        if (activeScanToken) {
          try {
            const scanData = await getScanStatus(activeScanToken)
            setRecentScan(scanData)

            // Start polling only for active scans
            if (scanData.status === 'queued' || scanData.status === 'running') {
              startPolling()
            } else if (scanData.status === 'complete' || scanData.status === 'failed') {
              localStorage.removeItem('activeScanToken')
              if (scanData.status === 'complete') {
                localStorage.setItem('lastScanToken', activeScanToken)
              }
            }
            return
          } catch (error) {
            console.log('Active scan not available')
            localStorage.removeItem('activeScanToken')
          }
        }

        // Check for last completed scan if no active scan
        const lastScanToken = localStorage.getItem('lastScanToken')
        if (lastScanToken) {
          try {
            const scanData = await getScanStatus(lastScanToken)
            if (scanData.status === 'complete') {
              setRecentScan(scanData)
              return
            }
          } catch (error) {
            console.log('Last scan not available or expired')
          }
        }

        setRecentScan(null)
      } catch (error) {
        console.error('Error initializing scan data:', error)
        setError('Failed to load scan data')
      } finally {
        setLoading(false)
      }
    }

    initializePolling()
  }, [startPolling])

  const getStats = () => {
    if (!recentScan) return { total: 0, available: 0, unavailable: 0, successRate: 0 }
    
    const total = recentScan.total_targets
    const available = recentScan.results.filter(r => r.availability).length
    const unavailable = total - available
    const successRate = total > 0 ? (available / total) * 100 : 0
    
    return { total, available, unavailable, successRate }
  }

  const stats = getStats()

  return (
    <Layout>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-200/30 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500/60 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading availability data...</p>
        </div>
      ) : (
        <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stat-card group">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Targets
                </h3>
                <Link href="/admin">
                  <div className="w-8 h-8 rounded-full bg-blue-50/80 dark:bg-blue-900/30
                    flex items-center justify-center text-blue-500 dark:text-blue-400
                    transform transition-all duration-300 ease-out
                    group-hover:scale-110 group-hover:bg-blue-100/80 dark:group-hover:bg-blue-900/50
                    group-hover:rotate-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>
              <p className="mt-3 text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 
                dark:from-white dark:to-gray-300 bg-clip-text text-transparent
                transition-all duration-300">
                {stats.total}
              </p>
              <div className="mt-1 text-xs text-gray-400">
                Network endpoints monitored
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Available</h3>
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              </div>
              <p className="mt-2 text-3xl font-semibold bg-gradient-to-r from-green-600 to-green-400 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
                {stats.available}
              </p>
              <div className="mt-1 text-xs text-gray-400">
                Responded successfully
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unavailable</h3>
                <XCircleIcon className="w-5 h-5 text-red-500" />
              </div>
              <p className="mt-2 text-3xl font-semibold bg-gradient-to-r from-red-600 to-red-400 dark:from-red-400 dark:to-red-300 bg-clip-text text-transparent">
                {stats.unavailable}
              </p>
              <div className="mt-1 text-xs text-gray-400">
                Connection issues detected
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime</h3>
                <ChartBarIcon className="w-5 h-5 text-blue-500" />
              </div>
              <p className="mt-2 text-3xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                {stats.successRate.toFixed(1)}%
              </p>
              <div className="mt-1 text-xs text-gray-400">
                System availability rate
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Scan Results Section - Shows Configured Targets */}
          <ScanResults scanData={recentScan} isLoading={loading} />
        </div>
      )}
    </Layout>
  )
}