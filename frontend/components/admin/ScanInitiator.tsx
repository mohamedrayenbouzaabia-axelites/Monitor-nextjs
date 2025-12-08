import React, { useState } from 'react';
import { ScanRequest } from '../../types/availability';
import { initiateScan, initiateAIScan } from '../../utils/api';
import { PlayIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface ScanInitiatorProps {
  ipAddresses: string[];
  endpoints: string[];
  onScanStarted: (token: string) => void;
}

const ScanInitiator: React.FC<ScanInitiatorProps> = ({ 
  ipAddresses, 
  endpoints, 
  onScanStarted 
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [generateAISummary, setGenerateAISummary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleStartScan = async () => {
    if (ipAddresses.length === 0 && endpoints.length === 0) {
      setError('Please add at least one IP address or endpoint to scan');
      return;
    }

    try {
      setIsStarting(true);
      setError(null);

      const request: ScanRequest = {
        ip_addresses: ipAddresses,
        endpoints: endpoints,
        generate_ai_summary: generateAISummary
      };

      // Choose the appropriate API endpoint based on AI summary setting
      const response = generateAISummary 
        ? await initiateAIScan(request)
        : await initiateScan(request);
      
      onScanStarted(response.token);
    } catch (error) {
      console.error('Error starting scan:', error);
      setError(error instanceof Error ? error.message : 'Failed to start scan');
    } finally {
      setIsStarting(false);
    }
  };

  const totalTargets = ipAddresses.length + endpoints.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <PlayIcon className="h-6 w-6 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Start Availability Scan
          </h3>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Targets</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalTargets}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600 dark:text-green-400">IP Addresses</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{ipAddresses.length}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Endpoints</div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{endpoints.length}</div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Cog6ToothIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Scan Configuration</span>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={generateAISummary}
              onChange={(e) => setGenerateAISummary(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Generate AI Summary (requires Gemini API key on server)
            </span>
          </label>
        </div>

        <button
          onClick={handleStartScan}
          disabled={isStarting || totalTargets === 0}
          className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isStarting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Starting Scan...
            </>
          ) : (
            <>
              <PlayIcon className="h-5 w-5 mr-2" />
              Start Scan
            </>
          )}
        </button>

        {totalTargets === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Add IP addresses or endpoints to start scanning
          </p>
        )}
      </div>
    </div>
  );
};

export default ScanInitiator;