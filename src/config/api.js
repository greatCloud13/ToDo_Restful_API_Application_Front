const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/api/auth/`,
  TODOS: `${API_BASE_URL}/todos/`,
  DASHBOARD: `${API_BASE_URL}/dashboard/`,
  CALENDAR: `${API_BASE_URL}/calendar/`,
  ANALYTICS: `${API_BASE_URL}/analytics/`,
  SUPPORT: `${API_BASE_URL}/support/`
};

export default API_BASE_URL;