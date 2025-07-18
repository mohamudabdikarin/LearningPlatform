const API_BASE_URL = 'http://localhost:8080/api';

const isProbablyValidToken = (token) => {
  // Basic check: JWTs have 2 dots and are not empty
  return token && token.split('.').length === 3;
};

const PUBLIC_ENDPOINTS = ['/courses', '/users'];

const handleResponse = async (response, endpoint) => {
  if (!response.ok) {
    if ((response.status === 401 || response.status === 403)) {
      // Only redirect for non-public endpoints
      const isPublic = PUBLIC_ENDPOINTS.some(pub => endpoint.startsWith(pub));
      if (!isPublic) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    if (response.status === 204) return null;
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(error.message || 'Something went wrong');
  }
  if (response.status === 204) return null;
  return response.json();
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  // Always start with a fresh headers object
  const headers = {};
  // Only set Content-Type to application/json if not uploading FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  // Only add Authorization header if token is present and looks valid
  if (isProbablyValidToken(token)) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Merge in any custom headers from options (but don't override Authorization)
  Object.assign(headers, options.headers);

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  return handleResponse(response, endpoint);
};

export const fetchCourses = async () => {
  return apiFetch('/courses', { method: 'GET' });
};

export const getProfile = async () => apiFetch('/users/me', { method: 'GET' });
export const updateProfile = async (data) => apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(data) });

const apiService = {
  get: async (url) => {
    return apiFetch(url, { method: 'GET' });
  },
  post: async (url, data) => {
    return apiFetch(url, { method: 'POST', body: JSON.stringify(data) });
  },
  put: async (url, data) => {
    return apiFetch(url, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete: async (url) => {
    return apiFetch(url, { method: 'DELETE' });
  }
};

export default apiService;