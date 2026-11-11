import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiUserPlus, FiEye, FiEyeOff, FiRefreshCw, FiCheckCircle, FiCopy, FiAlertCircle } from 'react-icons/fi';
import Shell from './_Shell.jsx';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import Button from '../components/ui/Button.jsx';
import { useCreateFaculty } from '../features/admin/hooks/useAdmin.js';

// Mirrors server validators/admin.validators.ts createFacultySchema – keep both in sync.
const schema = z.object({
  username: z
    .string()
    .min(3, 'Minimum 3 characters')
    .max(40, 'Maximum 40 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Letters, numbers, dots, underscores and hyphens only'),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .max(72, 'Maximum 72 characters')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/[0-9]/, 'Include at least one number'),
  name: z.string().trim().max(100, 'Maximum 100 characters').optional(),
});

/** Random password that always satisfies the schema (letter + number, 12 chars). */
function generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$%&!';
  const all = upper + lower + digits + symbols;
  const pick = (set) => set[Math.floor(Math.random() * set.length)];
  const chars = [pick(upper), pick(upper), pick(lower), pick(lower), pick(digits), pick(digits), pick(symbols)];
  while (chars.length < 12) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const fieldCls =
  'flex items-center gap-2.5 rounded-xl border border-line bg-card px-4 py-3 focus-within:border-brand-light focus-within:ring-2 focus-within:ring-brand-light/20';

function CreateFacultyForm({ onCreated }) {
  const createFaculty = useCreateFaculty();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const serverError = createFaculty.isError
    ? createFaculty.error?.response?.data?.message || 'Could not create the account – try again'
    : null;

  const onSubmit = async (values) => {
    try {
      const name = values.name?.trim() || undefined;
      const { user } = await createFaculty.mutateAsync({ ...values, name });
      onCreated({ ...values, name, user });
    } catch {
      // Handled by serverError above
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:gap-4.5" noValidate>
      <div>
        <label htmlFor="faculty-username" className="mb-2 block text-sm font-semibold text-ink">
          Username / Faculty ID
        </label>
        <div className={fieldCls}>
          <FiUserPlus aria-hidden className="text-ink-soft shrink-0" />
          <input
            id="faculty-username"
            autoComplete="off"
            placeholder="e.g. prof.sharma"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
            {...register('username')}
          />
        </div>
        {errors.username && <p className="mt-1.5 text-xs text-bad">{errors.username.message}</p>}
      </div>

      <div>
        <label htmlFor="faculty-name" className="mb-2 block text-sm font-semibold text-ink">
          Full name <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <div className={fieldCls}>
          <input
            id="faculty-name"
            autoComplete="off"
            placeholder="e.g. Dr. Anil Sharma"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
            {...register('name')}
          />
        </div>
        {errors.name && <p className="mt-1.5 text-xs text-bad">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="faculty-password" className="mb-2 block text-sm font-semibold text-ink">
          Password
        </label>
        <div className={fieldCls}>
          <input
            id="faculty-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Min 8 chars, 1 letter + 1 number"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setValue('password', generatePassword(), { shouldValidate: true })}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-brand/10 transition-colors p-1 focus:outline-none shrink-0"
            title="Generate a strong password"
          >
            <FiRefreshCw aria-hidden className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Generate</span>
          </button>
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

      <Button type="submit" variant="primary" size="lg" loading={createFaculty.isPending} className="mt-2 w-full font-semibold">
        {createFaculty.isPending ? 'Creating account…' : 'Create faculty account'}
      </Button>
    </form>
  );
}

/** Shown after a successful create – admin copies/shares these credentials with the professor. */
function CreatedCredentialsCard({ created, onReset }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = `ResultLens faculty login\nUsername: ${created.username}\nPassword: ${created.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-good/10 flex items-center justify-center shrink-0">
          <FiCheckCircle className="w-5 h-5 text-good" />
        </div>
        <div>
          <h3 className="text-base font-bold text-ink">
            Faculty account created{created.name ? ` for ${created.name}` : ''}
          </h3>
          <p className="mt-1 text-sm text-ink-soft leading-relaxed">
            Share these credentials with the professor. They can log in with them and upload result PDFs from the Upload
            page — nobody else can.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface divide-y divide-line/70">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Username</span>
          <code className="text-sm font-bold text-ink">{created.username}</code>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Password</span>
          <span className="flex items-center gap-2">
            <code className="text-sm font-bold text-ink">{showPassword ? created.password : '•'.repeat(Math.min(created.password.length, 16))}</code>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="text-ink-soft hover:text-ink transition-colors"
            >
              {showPassword ? <FiEyeOff size={16} aria-hidden /> : <FiEye size={16} aria-hidden />}
            </button>
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" variant="primary" onClick={copy} className="flex-1">
          <FiCopy aria-hidden /> {copied ? 'Copied!' : 'Copy credentials'}
        </Button>
        <Button type="button" variant="ghost" onClick={onReset} className="flex-1">
          Create another faculty account
        </Button>
      </div>
      <p className="text-xs text-ink-soft leading-relaxed">
        The password is stored as a bcrypt hash — it cannot be recovered later, so save it now before leaving this page.
      </p>
    </div>
  );
}

function AdminInner() {
  const [created, setCreated] = useState(null);

  return (
    <Shell
      title="Faculty Accounts"
      subtitle="Admin only — create a login account for each professor who should be allowed to upload result PDFs. There is no self-signup; credentials are always handed out from here."
    >
      <div className="max-w-xl">
        <div className="card p-6 sm:p-8">
          <h2 className="h2 mb-6">Create faculty account</h2>
          {created ? (
            <CreatedCredentialsCard created={created} onReset={() => setCreated(null)} />
          ) : (
            <CreateFacultyForm onCreated={setCreated} />
          )}
        </div>
      </div>
    </Shell>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminInner />
    </ProtectedRoute>
  );
}
