import api from '../../../services/axiosInstance.js';

/** Ranked lists – overall topper list. */
export async function getToppersOverallApi(limit = 50, filters = {}) {
  const { data } = await api.get('/toppers/overall', { params: { limit, ...filters } });
  return data.data;
}

/** Ranked lists – semester-wise topper list. */
export async function getToppersSemesterApi(semester, limit = 50, filters = {}) {
  const { data } = await api.get(`/toppers/semester/${semester}`, { params: { limit, ...filters } });
  return data.data;
}

/** Ranked lists – college-wise topper list. */
export async function getToppersCollegeApi(instCode, limit = 50, filters = {}) {
  const { data } = await api.get(`/toppers/college/${instCode}`, { params: { limit, ...filters } });
  return data.data;
}

/** Ranked lists – subject-wise topper list. */
export async function getToppersSubjectApi(paperId, limit = 10, filters = {}) {
  const { data } = await api.get(`/toppers/subject/${paperId}`, { params: { limit, ...filters } });
  return data.data;
}
