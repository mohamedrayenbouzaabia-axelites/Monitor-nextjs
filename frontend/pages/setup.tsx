import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function Setup() {
  const router = useRouter();
  const [isConfigured, setIsConfigured] = useState(false);
  const [scannerUrl, setScannerUrl] = useState('http://localhost:8000');
  const [testConnection, setTestConnection] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const testScannerConnection = async () => {
    setTestConnection('testing');
    setErrorMessage('');

    try {
      const response = await fetch(`${scannerUrl}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip_addresses: ['8.8.8.8'],
          endpoints: [],
          generate_ai_summary: false
        }),
      });

      if (response.ok) {
        setTestConnection('success');
        setIsConfigured(true);
        localStorage.setItem('scannerUrl', scannerUrl);
        localStorage.setItem('setupComplete', 'true');
      } else {
        setTestConnection('error');
        setErrorMessage(`Scanner responded with status: ${response.status}`);
      }
    } catch (error) {
      setTestConnection('error');
      setErrorMessage(`Cannot connect to scanner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleComplete = () => {
    router.push('/');
  };

  // Check if already configured
  React.useEffect(() => {
    const setupComplete = localStorage.getItem('setupComplete');
    const savedScannerUrl = localStorage.getItem('scannerUrl');
    
    if (setupComplete === 'true' && savedScannerUrl) {
      setIsConfigured(true);
      setScannerUrl(savedScannerUrl);
    }
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-2xl mx-auto pt-16 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Availability Checker
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Let's set up your scanner service to get started
              </p>
            </div>

            {!isConfigured ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scanner Service URL
                  </label>
                  <input
                    type="text"
                    value={scannerUrl}
                    onChange={(e) => setScannerUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Enter the URL where your scanner service is running
                  </p>
                </div>

                {testConnection === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errorMessage}
                    </div>
                  </div>
                )}

                {testConnection === 'success' && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M5 13l4 4L19 7" />
                      </svg>
                      Connection successful! Scanner service is responding.
                    </div>
                  </div>
                )}

                <button
                  onClick={testScannerConnection}
                  disabled={testConnection === 'testing'}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {testConnection === 'testing' ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Testing Connection...
                    </div>
                  ) : (
                    'Test & Configure Scanner'
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Configuration Complete!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your scanner service is configured and ready to use.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Scanner URL:</div>
                  <div className="font-medium text-gray-900 dark:text-white">{scannerUrl}</div>
                </div>

                <button
                  onClick={handleComplete}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}