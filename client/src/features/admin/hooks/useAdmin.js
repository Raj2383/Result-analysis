import { useMutation } from '@tanstack/react-query';
import { createFacultyApi } from '../api/adminApi.js';

export function useCreateFaculty() {
  return useMutation({ mutationFn: createFacultyApi });
}
