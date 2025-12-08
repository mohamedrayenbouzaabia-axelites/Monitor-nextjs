import React from 'react';
import { TargetScanResult, ScanProgressResponse } from '../types/availability';
import { CheckCircleIcon, XCircleIcon, ClockIcon, GlobeAltIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface ScanResultsProps {
  scanData: ScanProgressResponse | null;
  isLoading?: boolean;
}

const ScanResults: React.FC<ScanResultsProps> = ({ scanData, isLoading = false }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'running':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getAvailabilityBadge = (availability: boolean) => {
    if (availability) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Available
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Unavailable
        </span>
      );
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCountryFlag = (country: string | null) => {
    if (!country) return null;
    const countryCode = country.toLowerCase().slice(0, 2);
    return (
      <img 
        src={`https://cdn.jsdelivr.net/gh/xykt/ISO3166@main/flags/svg/${countryCode}.svg`}
        alt={country}
        className="inline-block w-6 h-4 rounded shadow-sm"
        onError={(e) => {
          e.currentTarget.src = 'https://cdn.jsdelivr.net/gh/xykt/ISO3166@main/flags/svg/un.svg';
        }}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No scan data available
        </div>
      </div>
    );
  }

  const progressPercentage = scanData.total_targets > 0 
    ? (scanData.completed_targets / scanData.total_targets) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Scan Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(scanData.status)}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scan Results
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(scanData.status)}`}>
              {scanData.status.charAt(0).toUpperCase() + scanData.status.slice(1)}
            </span>
            {scanData.status === 'running' && (
              <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Live Update</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Mode: {scanData.mode === 'ai' ? 'AI Enhanced' : 'Standard'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{scanData.completed_targets} / {scanData.total_targets} targets</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Started:</span>
            <div className="font-medium text-gray-900 dark:text-white">
              {formatDateTime(scanData.started_at)}
            </div>
          </div>
          {scanData.finished_at && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Finished:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatDateTime(scanData.finished_at)}
              </div>
            </div>
          )}
          <div>
            <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
            <div className="font-medium text-gray-900 dark:text-white">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {scanData.results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Target Results ({scanData.results.length})
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Open Ports
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {scanData.results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {result.target}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.ip_address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAvailabilityBadge(result.availability)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getCountryFlag(result.country)}
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {result.location || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.country || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {result.provider || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {result.open_ports.length > 0 ? (
                          result.open_ports.slice(0, 3).map(port => (
                            <span key={port} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              {port}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">None</span>
                        )}
                        {result.open_ports.length > 3 && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            +{result.open_ports.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.risk_level === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        result.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        result.risk_level === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {result.risk_level.charAt(0).toUpperCase() + result.risk_level.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanResults;