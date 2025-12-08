import React, { useState, useEffect } from 'react';
import { IPAddress, Endpoint } from '../../types/availability';
import { getIPAddresses, getEndpoints, addIPAddress, addEndpoint, deleteIPAddress, deleteEndpoint } from '../../utils/api';
import { PlusIcon, TrashIcon, GlobeAltIcon, ServerIcon } from '@heroicons/react/24/outline';

interface TargetManagementProps {
  onScanInitiated?: () => void;
}

const TargetManagement: React.FC<TargetManagementProps> = ({ onScanInitiated }) => {
  const [ipAddresses, setIpAddresses] = useState<IPAddress[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingIP, setIsAddingIP] = useState(false);
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newDescription, setNewDescription] = useState('');

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

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleAddIP = async () => {
    if (!newIP.trim()) return;

    try {
      setError(null);
      await addIPAddress(newIP.trim(), newDescription.trim() || undefined);
      setNewIP('');
      setNewDescription('');
      setIsAddingIP(false);
      await fetchTargets();
    } catch (error) {
      console.error('Error adding IP address:', error);
      setError('Failed to add IP address');
    }
  };

  const handleAddEndpoint = async () => {
    if (!newEndpoint.trim()) return;

    try {
      setError(null);
      await addEndpoint(newEndpoint.trim(), newDescription.trim() || undefined);
      setNewEndpoint('');
      setNewDescription('');
      setIsAddingEndpoint(false);
      await fetchTargets();
    } catch (error) {
      console.error('Error adding endpoint:', error);
      setError('Failed to add endpoint');
    }
  };

  const handleDeleteIP = async (id: string) => {
    try {
      setError(null);
      await deleteIPAddress(id);
      await fetchTargets();
    } catch (error) {
      console.error('Error deleting IP address:', error);
      setError('Failed to delete IP address');
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    try {
      setError(null);
      await deleteEndpoint(id);
      await fetchTargets();
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      setError('Failed to delete endpoint');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* IP Addresses Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ServerIcon className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              IP Addresses ({ipAddresses.length})
            </h3>
          </div>
          <button
            onClick={() => setIsAddingIP(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add IP
          </button>
        </div>

        {isAddingIP && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  IP Address *
                </label>
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="e.g., 192.168.1.1 or 8.8.8.8"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description for this IP address"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddIP}
                  disabled={!newIP.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Add IP Address
                </button>
                <button
                  onClick={() => {
                    setIsAddingIP(false);
                    setNewIP('');
                    setNewDescription('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {ipAddresses.map((ip) => (
            <div key={ip.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{ip.address}</div>
                {ip.description && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">{ip.description}</div>
                )}
              </div>
              <button
                onClick={() => handleDeleteIP(ip.id)}
                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {ipAddresses.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No IP addresses configured
            </div>
          )}
        </div>
      </div>

      {/* Endpoints Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <GlobeAltIcon className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Endpoints ({endpoints.length})
            </h3>
          </div>
          <button
            onClick={() => setIsAddingEndpoint(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Endpoint
          </button>
        </div>

        {isAddingEndpoint && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Endpoint URL *
                </label>
                <input
                  type="text"
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  placeholder="e.g., example.com or ec2-54-176-98-121.us-west-1.compute.amazonaws.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description for this endpoint"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddEndpoint}
                  disabled={!newEndpoint.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Add Endpoint
                </button>
                <button
                  onClick={() => {
                    setIsAddingEndpoint(false);
                    setNewEndpoint('');
                    setNewDescription('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {endpoints.map((endpoint) => (
            <div key={endpoint.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{endpoint.url}</div>
                {endpoint.description && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">{endpoint.description}</div>
                )}
              </div>
              <button
                onClick={() => handleDeleteEndpoint(endpoint.id)}
                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {endpoints.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No endpoints configured
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TargetManagement;