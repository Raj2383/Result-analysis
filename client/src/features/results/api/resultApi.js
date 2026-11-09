import api from '../../../services/axiosInstance.js';

/** Student marks + SGPA/CGPA for one enrollment number (optionally scoped to a semester). */
export async function getStudentResultApi(rollNo, semester) {
  const { data } = await api.get(`/results/${rollNo}`, { params: semester ? { semester } : {} });
  return data.data;
}

/** Free-text student search (enrollment substring). */
export async function searchStudentsApi({ q, limit = 20, page = 1 }) {
  const { data } = await api.get('/results/search', { params: { q, limit, page } });
  return data.data;
}
