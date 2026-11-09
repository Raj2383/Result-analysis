import api from '../../services/api';

export async function getCoursesApi() {
  const { data } = await api.get('/programmes');
  return data?.data ?? [];
}

export default { getCoursesApi };
