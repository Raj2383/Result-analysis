import api from '../../../services/axiosInstance.js';

/** Faculty/admin login – sets the httpOnly session cookie server-side. */
export async function loginApi({ username, password }) {
  const { data } = await api.post('/auth/login', { username, password });
  return data.data;
}

export async function logoutApi() {
  const { data } = await api.post('/auth/logout');
  return data;
}

/** Current session (throws 401 when logged out – callers treat that as logged-out). */
export async function meApi() {
  const { data } = await api.get('/auth/me');
  return data.data;
}
