import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import TargetManagement from '../../components/admin/TargetManagement';
import ScanInitiator from '../../components/admin/ScanInitiator';
import ScanResults from '../../components/ScanResults';
import DemoPasswordOverride from '../../components/admin/DemoPasswordOverride';
import { useAuth } from '../../hooks/useAuth';
import { useTargetedPolling } from '../../hooks/useTargetedPolling';
import { getIPAddresses, getEndpoints, getScanStatus } from '../../utils/api';
import { IPAddress, Endpoint, ScanProgressResponse } from '../../types/availability';
import {
  PlayIcon,
  ServerIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Toaster, toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [ipAddresses, setIpAddresses] = useState<IPAddress[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScanToken, setActiveScanToken] = useState<string | null>(null);
  const [scanData, setScanData] = useState<ScanProgressResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showDemoPasswordOverride, setShowDemoPasswordOverride] = useState(false);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ipData, endpointData] = await Promise.all([
        getIPAddresses().catch(() => []),
        getEndpoints().catch(() => [])
      ]);
      
      setIpAddresses(ipData);
      setEndpoints(endpointData);
    } catch (error) {
      console.error('Error fetching targets:', error);
      setError('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  const pollScanStatus = async (token: string) => {
    try {
      const statusData = await getScanStatus(token);
      setScanData(statusData);
      
      // Stop polling when scan is completed or failed
      if (statusData.status === 'complete' || statusData.status === 'failed') {
        stopPolling();
        setActiveScanToken(null); // Clear the active scan token

        if (statusData.status === 'complete') {
          toast.success('Scan completed successfully!');
          // Store the completed scan token for the home page
          localStorage.setItem('lastScanToken', token);
        } else if (statusData.status === 'failed') {
          toast.error('Scan failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error polling scan status:', error);
      // Stop polling on error
      stopPolling();
      toast.error('Failed to get scan status');
    }
  };

  // Use targeted polling for scan status updates
  const { start: startPollingScan, stop: stopPollingScan } = useTargetedPolling(
    async () => {
      if (!activeScanToken) return;
      await pollScanStatus(activeScanToken);
    },
    {
      interval: 5000, // Reduced frequency to prevent visual glitches
      enabled: false,
      onStop: () => {
        setIsPolling(false);
        console.log('Admin scan polling stopped');
      }
    }
  );

  const startPolling = (token: string) => {
    setActiveScanToken(token);
    setScanData(null);
    setIsPolling(true);

    // Set active scan token for targeted polling
    localStorage.setItem('activeScanToken', token);

    // Start targeted polling
    startPollingScan();

    // Initial poll
    pollScanStatus(token);
  };

  const stopPolling = () => {
    setIsPolling(false);
    setActiveScanToken(null);
    localStorage.removeItem('activeScanToken');

    // Stop targeted polling
    stopPollingScan();
  };

  useEffect(() => {
    fetchTargets();

    // Sync targets with backend on admin page load
    const syncTargets = async () => {
      try {
        const ipData = await getIPAddresses().catch(() => []);
        const endpointData = await getEndpoints().catch(() => []);
        // Import syncTargetsWithBackend dynamically to avoid circular dependency
        const { syncTargetsWithBackend } = await import('../../utils/targetSync');
        await syncTargetsWithBackend(ipData, endpointData);
      } catch (error) {
        console.log('Failed to sync targets with backend:', error);
      }
    };

    syncTargets();

    // Check for active scan on page load
    const lastScanToken = localStorage.getItem('activeScanToken');
    if (lastScanToken) {
      // Verify the scan is still active before starting to poll
      getScanStatus(lastScanToken)
        .then(statusData => {
          if (statusData.status === 'running') {
            startPolling(lastScanToken);
          } else {
            // Clear completed/failed scan token from storage
            localStorage.removeItem('activeScanToken');
          }
        })
        .catch(() => {
          // If we can't get the status, clear the token
          localStorage.removeItem('activeScanToken');
        });
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Store active scan token
    if (activeScanToken) {
      localStorage.setItem('activeScanToken', activeScanToken);
    } else {
      localStorage.removeItem('activeScanToken');
    }
  }, [activeScanToken]);

  const handleScanStarted = (token: string) => {
    startPolling(token);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Availability Checker - Admin Dashboard
              </h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchTargets}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 space-x-2
                    bg-gray-600 hover:bg-gray-700 
                    dark:bg-gray-500 dark:hover:bg-gray-600
                    text-white rounded-lg shadow-sm
                    transition-all duration-200 hover:scale-105 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setShowDemoPasswordOverride(true)}
                  className="inline-flex items-center px-4 py-2 space-x-2
                    bg-orange-600 hover:bg-orange-700 
                    text-white rounded-lg shadow-sm
                    transition-all duration-200 hover:scale-105"
                  title="Demo: Override admin password without verification"
                >
                  <KeyIcon className="h-5 w-5" />
                  <span>Demo Override</span>
                </button>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-4 py-2 space-x-2
                    bg-red-600 hover:bg-red-700 
                    text-white rounded-lg shadow-sm
                    transition-all duration-200 hover:scale-105"
                >
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Targets
                    </h3>
                    <ServerIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 
                    dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {ipAddresses.length + endpoints.length}
                  </p>
                </div>
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      IP Addresses
                    </h3>
                    <GlobeAltIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
                    {ipAddresses.length}
                  </p>
                </div>
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Endpoints
                    </h3>
                    <PlayIcon className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent">
                    {endpoints.length}
                  </p>
                </div>
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Active Scan
                    </h3>
                    <ArrowPathIcon className={`w-5 h-5 ${isPolling ? 'text-blue-500 animate-spin' : 'text-gray-400'}`} />
                  </div>
                  <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                    {isPolling ? 'Running' : 'Idle'}
                  </p>
                </div>
              </div>

              {/* Target Management */}
              <TargetManagement />

              {/* Scan Initiator */}
              <ScanInitiator
                ipAddresses={ipAddresses.map(ip => ip.address)}
                endpoints={endpoints.map(ep => ep.url)}
                onScanStarted={handleScanStarted}
              />

              {/* Active Scan Results */}
              {activeScanToken && (
                <ScanResults
                  scanData={scanData}
                  isLoading={isPolling}
                />
              )}
            </div>
          </div>
        </div>

        {/* Demo Password Override Modal */}
        <DemoPasswordOverride
          isOpen={showDemoPasswordOverride}
          onClose={() => setShowDemoPasswordOverride(false)}
        />
      </Layout>
    </ProtectedRoute>
  );
}