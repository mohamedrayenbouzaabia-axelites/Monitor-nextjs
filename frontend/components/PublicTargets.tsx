import React, { useState, useEffect, useRef } from 'react';
import { getPublicTargetsSummary } from '../utils/api';
import { useSilentRefresh } from '../hooks/useSilentRefresh';
import { GlobeAltIcon, ServerIcon, LinkIcon } from '@heroicons/react/24/outline';

interface PublicTarget {
  type: 'ip' | 'endpoint';
  value: string;
  description?: string;
}

interface TargetsSummary {
  total_targets: number;
  ip_addresses: number;
  endpoints: number;
  targets: PublicTarget[];
}

export default function PublicTargets() {
  const [targets, setTargets] = useState<TargetsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicTargetsSummary();
        setTargets(data);
      } catch (err) {
        console.error('Error fetching targets:', err);
        setError('Failed to load targets');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch only
    fetchTargets();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !targets) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-red-500 dark:text-red-400">Unable to load targets information</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <ServerIcon className="h-6 w-6 text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Monitored Targets
        </h2>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Total Targets
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {targets.total_targets}
              </div>
            </div>
            <ServerIcon className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                IP Addresses
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {targets.ip_addresses}
              </div>
            </div>
            <GlobeAltIcon className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Endpoints
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {targets.endpoints}
              </div>
            </div>
            <LinkIcon className="h-8 w-8 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Targets List */}
      {targets.targets.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Active Monitoring Targets
          </h3>
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {targets.targets.map((target, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {target.type === 'ip' ? (
                    <GlobeAltIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <LinkIcon className="h-5 w-5 text-purple-500" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {target.value}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {target.type}
                    </div>
                  </div>
                </div>
                {target.description && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 text-right max-w-xs">
                    {target.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No monitoring targets configured yet
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                These targets are actively monitored for availability. System administrators receive real-time alerts when any target becomes unavailable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}