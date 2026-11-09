import api from '../../../services/axiosInstance.js';

/** Ranked lists – overall topper list. */
export async function getToppersOverallApi(limit = 50) {
  const { data } = await api.get('/toppers/overall', { params: { limit } });
  return data.data;
}

/** Ranked lists – semester-wise topper list. */
export async function getToppersSemesterApi(semester, limit = 50) {
  const { data } = await api.get(`/toppers/semester/${semester}`, { params: { limit } });
  return data.data;
}

/** Ranked lists – college-wise topper list. */
export async function getToppersCollegeApi(instCode, limit = 50) {
  const { data } = await api.get(`/toppers/college/${instCode}`, { params: { limit } });
  return data.data;
}

/** Ranked lists – subject-wise topper list. */
export async function getToppersSubjectApi(paperId, limit = 10) {
  const { data } = await api.get(`/toppers/subject/${paperId}`, { params: { limit } });
  return data.data;
}
