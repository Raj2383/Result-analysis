import api from '../../../services/axiosInstance.js';

/** Overview KPIs, batches, institutions and recent uploads. */
export async function getOverviewApi(params = {}) {
  const { data } = await api.get('/overview', { params });
  return data.data;
}
