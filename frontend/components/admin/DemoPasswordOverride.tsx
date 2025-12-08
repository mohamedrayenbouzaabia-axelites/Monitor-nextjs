import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { demoOverridePassword } from '../../utils/api';

interface DemoPasswordOverrideProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DemoPasswordOverride: React.FC<DemoPasswordOverrideProps> = ({ isOpen, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleQuickOverride = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);

    const defaultPassword = 'admin123';

    try {
      await demoOverridePassword(defaultPassword);

      setSuccess(true);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(false);
        setError('');
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to override password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Quick Demo Setup
          </h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Demo Mode:</strong> This will set the password to <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">admin123</code> for easy access.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-500 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-2">
              ✓ Password set to <code>admin123</code>! You can now login.
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleQuickOverride}
              disabled={loading || success}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600
                hover:bg-orange-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting up...
                </span>
              ) : success ? (
                'Done!'
              ) : (
                'Set Demo Password'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPasswordOverride;