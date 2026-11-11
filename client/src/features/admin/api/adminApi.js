import api from '../../../services/axiosInstance.js';

/** Admin-only – create a faculty (professor) account. Returns { user } (safe, no password_hash). */
export async function createFacultyApi({ username, password, name }) {
  const { data } = await api.post('/admin/faculty', { username, password, name });
  return data.data;
}
