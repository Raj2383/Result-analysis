import api from '../../../services/axiosInstance.js';

/** Analytics aggregate summary (pass rate, CGPA, backlogs, grace marks). */
export async function getAnalyticsApi(params = {}) {
  const { data } = await api.get('/analytics/summary', { params });
  return data.data;
}
