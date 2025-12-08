import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { checkAuthStatus, initializeAuth, loginAuth } from '../utils/api';
import DemoPasswordOverride from '../components/admin/DemoPasswordOverride';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [showDemoOverride, setShowDemoOverride] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin');
      return;
    }

    const checkInitialization = async () => {
      try {
        const data = await checkAuthStatus();
        setIsInitializing(!data.initialized);
      } catch (error) {
        console.error('Error checking initialization:', error);
        setIsInitializing(true);
      }
    };

    checkInitialization();
  }, [isAuthenticated]);

  // Show default password hint in development
  const showDefaultPasswordHint = !isInitializing && process.env.NODE_ENV === 'development';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isInitializing) {
        await initializeAuth(password);
        await login(password);
        router.push('/admin');
      } else {
        await login(password);
        router.push('/admin');
      }
    } catch (err) {
      setError('Invalid password');
    }
  };

  const handleDemoOverrideSuccess = async () => {
    // After successful demo override, automatically log in with the default password
    try {
      await login('admin123');
      router.push('/admin');
    } catch (error) {
      console.error('Error auto-logging in after demo override:', error);
      // If auto-login fails, just refresh the auth status
      const data = await checkAuthStatus();
      setIsInitializing(!data.initialized);
      setShowDemoOverride(false);
      setError('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isInitializing ? 'Set Admin Password' : 'Admin Login'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 
                border border-gray-300 dark:border-gray-700 placeholder-gray-500 
                text-gray-900 dark:text-white bg-white dark:bg-gray-800 
                focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {showDefaultPasswordHint && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Development Mode:</strong> Default password is <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">admin123</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Demo Override Button - Always visible in development or when there's an error */}
          {(!isInitializing || error) && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowDemoOverride(true)}
                className="text-orange-600 hover:text-orange-500 text-sm underline"
              >
                {isInitializing ? 'Use Demo Password Instead' : 'Forgot password? Use Demo Override'}
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4
                border border-transparent text-sm font-medium rounded-md
                text-white bg-blue-600 hover:bg-blue-700 focus:outline-none
                focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isInitializing ? 'Set Password' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Demo Password Override Modal */}
        <DemoPasswordOverride
          isOpen={showDemoOverride}
          onClose={() => setShowDemoOverride(false)}
          onSuccess={handleDemoOverrideSuccess}
        />
      </div>
    </div>
  );
}
