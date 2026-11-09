import { createContext, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loginApi, logoutApi, meApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ['me'], queryFn: meApi, retry: false, staleTime: 5 * 60 * 1000 });
  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.setQueryData(['me'], null);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const value = useMemo(
    () => ({
      user: meQuery.data?.user || null,
      isLoading: meQuery.isLoading,
      login: loginMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
      loginState: loginMutation,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meQuery.data, meQuery.isLoading, loginMutation.status, logoutMutation.status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
