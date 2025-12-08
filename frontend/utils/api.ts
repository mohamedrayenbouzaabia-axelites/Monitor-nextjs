import { API_URL } from '../config/config';
import { ScanRequest, ScanProgressResponse, ScanInitResponse, IPAddress, Endpoint } from '../types/availability';

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  // 从 localStorage 获取 token
  const token = localStorage.getItem('adminToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

// Admin authentication functions
export const checkAuthStatus = async (): Promise<{initialized: boolean}> => {
  const response = await fetch(`${API_URL}/auth/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to check authentication status');
  }
  
  return response.json();
};

export const initializeAuth = async (password: string): Promise<{success: boolean}> => {
  const response = await fetch(`${API_URL}/auth/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to initialize authentication');
  }
  
  return response.json();
};

export const loginAuth = async (password: string): Promise<{token: string}> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return response.json();
};

export const resetPasswordAuth = async (oldPassword: string, newPassword: string): Promise<{success: boolean}> => {
  const token = localStorage.getItem('adminToken');
  
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to reset password');
  }
  
  return response.json();
};

export const demoOverridePassword = async (newPassword: string): Promise<{success: boolean, message: string}> => {
  const response = await fetch(`${API_URL}/auth/demo-override-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to override password');
  }
  
  return response.json();
};

// Availability checker API functions
export const initiateScan = async (request: ScanRequest): Promise<ScanInitResponse> => {
  const response = await fetch(`${API_URL}/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to initiate scan: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
};

export const initiateAIScan = async (request: ScanRequest): Promise<ScanInitResponse> => {
  const response = await fetch(`${API_URL}/ai-agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to initiate AI scan: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
};

export const getScanStatus = async (token: string): Promise<ScanProgressResponse> => {
  const response = await fetch(`${API_URL}/scan/${token}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get scan status: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
};

// Local storage-based admin functions for managing IPs and endpoints
export const addIPAddress = async (address: string, description?: string) => {
  try {
    const ipAddresses = getIPAddressesFromStorage();
    const newIP: IPAddress = {
      id: Date.now().toString(),
      address: address.trim(),
      description: description?.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    ipAddresses.push(newIP);
    localStorage.setItem('ipAddresses', JSON.stringify(ipAddresses));
    
    return newIP;
  } catch (error) {
    throw new Error(`Failed to add IP address: ${error}`);
  }
};

export const deleteIPAddress = async (id: string) => {
  try {
    const ipAddresses = getIPAddressesFromStorage();
    const filteredIPs = ipAddresses.filter(ip => ip.id !== id);
    localStorage.setItem('ipAddresses', JSON.stringify(filteredIPs));
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete IP address: ${error}`);
  }
};

export const addEndpoint = async (url: string, description?: string) => {
  try {
    const endpoints = getEndpointsFromStorage();
    const newEndpoint: Endpoint = {
      id: Date.now().toString(),
      url: url.trim(),
      description: description?.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    endpoints.push(newEndpoint);
    localStorage.setItem('endpoints', JSON.stringify(endpoints));
    
    return newEndpoint;
  } catch (error) {
    throw new Error(`Failed to add endpoint: ${error}`);
  }
};

export const deleteEndpoint = async (id: string) => {
  try {
    const endpoints = getEndpointsFromStorage();
    const filteredEndpoints = endpoints.filter(ep => ep.id !== id);
    localStorage.setItem('endpoints', JSON.stringify(filteredEndpoints));
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete endpoint: ${error}`);
  }
};

export const getIPAddresses = async (): Promise<IPAddress[]> => {
  try {
    return getIPAddressesFromStorage();
  } catch (error) {
    console.error('Error fetching IP addresses:', error);
    return [];
  }
};

export const getEndpoints = async (): Promise<Endpoint[]> => {
  try {
    return getEndpointsFromStorage();
  } catch (error) {
    console.error('Error fetching endpoints:', error);
    return [];
  }
};

// Public API functions for guest interface
export const getPublicTargets = async () => {
  try {
    const response = await fetch(`${API_URL}/public/targets`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch public targets: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching public targets:', error);
    return { ip_addresses: [], endpoints: [] };
  }
};

export const getPublicTargetsSummary = async () => {
  try {
    const response = await fetch(`${API_URL}/public/targets/summary`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch targets summary: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching targets summary:', error);
    return {
      total_targets: 0,
      ip_addresses: 0,
      endpoints: 0,
      targets: []
    };
  }
};

// Helper functions for local storage management
const getIPAddressesFromStorage = (): IPAddress[] => {
  try {
    const stored = localStorage.getItem('ipAddresses');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error parsing IP addresses from storage:', error);
    return [];
  }
};

const getEndpointsFromStorage = (): Endpoint[] => {
  try {
    const stored = localStorage.getItem('endpoints');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error parsing endpoints from storage:', error);
    return [];
  }
};
