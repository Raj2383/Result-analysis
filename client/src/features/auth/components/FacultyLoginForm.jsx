import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiUser, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';

// Mirrors server validators/auth.validators.js loginSchema (faculty/admin only).
const schema = z.object({
  username: z.string().min(3, 'Enter your faculty ID'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

export default function FacultyLoginForm({ onSuccess }) {
  const { login, loginState } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const serverError = loginState.isError
    ? loginState.error?.response?.data?.message || 'Login failed – try again'
    : null;

  const onSubmit = async (values) => {
    await login(values);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5" noValidate>
      <div>
        <label htmlFor="login-username" className="mb-1.5 block text-[13px] font-semibold text-ink">
          Username / Faculty ID
        </label>
        <div className="flex items-center gap-2 rounded-[10px] border border-line bg-card px-3 py-2.5 focus-within:border-brand-light focus-within:ring-2 focus-within:ring-brand-light/20">
          <FiUser aria-hidden className="text-ink-soft" />
          <input
            id="login-username"
            autoComplete="username"
            placeholder="Enter username"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
            {...register('username')}
          />
        </div>
        {errors.username && <p className="mt-1 text-[13px] text-bad">{errors.username.message}</p>}
      </div>

      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-[13px] font-semibold text-ink">
          Password
        </label>
        <div className="flex items-center gap-2 rounded-[10px] border border-line bg-card px-3 py-2.5 focus-within:border-brand-light focus-within:ring-2 focus-within:ring-brand-light/20">
          <FiLock aria-hidden className="text-ink-soft" />
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter password"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
            {...register('password')}
          />
        </div>
        {errors.password && <p className="mt-1 text-[13px] text-bad">{errors.password.message}</p>}
      </div>

      {serverError && (
        <p role="alert" className="flex items-center gap-2 text-[13px] text-bad">
          <FiAlertCircle aria-hidden /> {serverError}
        </p>
      )}

      <button type="submit" disabled={loginState.isPending} className="btn-primary mt-1 w-full !py-3 !text-[15px]">
        {loginState.isPending ? 'Signing in…' : 'Log in'}
      </button>
    </form>
  );
}
