import api from '../../../services/axiosInstance.js';

/** Upload a result PDF (faculty/admin). Returns { upload, stats, warnings }. */
export async function uploadPdfApi(file, onProgress) {
  const form = new FormData();
  form.append('pdf', file);
  const { data } = await api.post('/uploads', form, {
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data.data;
}

export async function uploadHistoryApi() {
  const { data } = await api.get('/uploads');
  return data.data;
}

export async function deleteUploadApi(id) {
  const { data } = await api.delete(`/uploads/${id}`);
  return data.data;
}
