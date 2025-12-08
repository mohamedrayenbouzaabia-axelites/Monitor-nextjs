import { createContext, useContext, useState, useEffect } from 'react';
import { loginAuth } from '../utils/api';

const AuthContext = createContext<{
  isAuthenticated: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
}>({
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  token: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    setToken(storedToken);
    setIsAuthenticated(!!storedToken);
  }, []);

  const login = async (password: string) => {
    const { token } = await loginAuth(password);
    localStorage.setItem('adminToken', token);
    setToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 