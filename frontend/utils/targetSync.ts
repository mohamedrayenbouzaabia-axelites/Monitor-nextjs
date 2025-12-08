import { IPAddress, Endpoint } from '../types/availability';
import { API_URL } from '../config/config';

// Sync targets with backend
export const syncTargetsWithBackend = async (ipAddresses: IPAddress[], endpoints: Endpoint[]) => {
  try {
    // Sync IP addresses
    for (const ip of ipAddresses) {
      await fetch(`${API_URL}/targets/ip-addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(ip),
      });
    }

    // Sync endpoints
    for (const endpoint of endpoints) {
      await fetch(`${API_URL}/targets/endpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(endpoint),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error syncing targets with backend:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Delete target from backend
export const deleteTargetFromBackend = async (type: 'ip' | 'endpoint', id: string) => {
  try {
    const endpoint = type === 'ip' ? `/targets/ip-addresses/${id}` : `/targets/endpoints/${id}`;

    await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error(`Error deleting ${type} from backend:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};