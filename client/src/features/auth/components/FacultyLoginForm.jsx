import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiUser, FiLock, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import Button from '../../../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Mirrors server validators/auth.validators.js loginSchema (faculty/admin only).
const schema = z.object({
  username: z.string().min(3, 'Enter your faculty ID'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

export default function FacultyLoginForm({ onSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
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
    try {
      await login(values);
      onSuccess?.();
    } catch {
      // Handled by loginState.error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:gap-4.5" noValidate>
      <div>
        <label htmlFor="login-username" className="mb-2 block text-sm font-semibold text-ink">
          Username / Faculty ID
        </label>
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-4 py-3 focus-within:border-brand-light focus-within:ring-2 focus-within:ring-brand-light/20">
          <FiUser aria-hidden className="text-ink-soft shrink-0" />
          <input
            id="login-username"
            autoComplete="username"
            placeholder="Enter username"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
            {...register('username')}
          />
        </div>
        {errors.username && <p className="mt-1.5 text-xs text-bad">{errors.username.message}</p>}
      </div>

      <div>
        <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-ink">
          Password
        </label>
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-4 py-3 focus-within:border-brand-light focus-within:ring-2 focus-within:ring-brand-light/20">
          <FiLock aria-hidden className="text-ink-soft shrink-0" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter password"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="text-ink-soft hover:text-ink transition-colors p-1 focus:outline-none shrink-0"
          >
            {showPassword ? <FiEyeOff size={18} aria-hidden /> : <FiEye size={18} aria-hidden />}
          </button>
        </div>
        {errors.password && <p className="mt-1.5 text-xs text-bad">{errors.password.message}</p>}
      </div>

      {serverError && (
        <p role="alert" className="flex items-center gap-2 text-xs text-bad">
          <FiAlertCircle aria-hidden /> {serverError}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" loading={loginState.isPending} className="mt-2 w-full font-semibold">
        {loginState.isPending ? 'Signing in…' : 'Log in'}
      </Button>
    </form>
  );
}
