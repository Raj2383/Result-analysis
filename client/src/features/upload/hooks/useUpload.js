import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uploadPdfApi, uploadHistoryApi } from '../api/uploadApi.js';

export function useUploadHistory() {
  return useQuery({ queryKey: ['uploads'], queryFn: uploadHistoryApi });
}

export function usePdfUpload() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const mutation = useMutation({
    mutationFn: (file) => uploadPdfApi(file, setProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      setProgress(100);
    },
    onError: () => setProgress(0),
  });
  return { ...mutation, progress, resetProgress: () => setProgress(0) };
}
