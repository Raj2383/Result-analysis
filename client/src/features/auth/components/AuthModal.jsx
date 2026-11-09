import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import FacultyLoginForm from './FacultyLoginForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const { loginState } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    loginState.reset();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    dialogRef.current?.querySelector('input')?.focus();
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,14,34,.55)] p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Faculty login"
        className="relative w-full max-w-[400px] rounded-2xl border border-line bg-card p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close login dialog"
          className="absolute right-3.5 top-3 text-[26px] leading-none text-ink-soft hover:text-ink"
        >
          <FiX aria-hidden />
        </button>
        <h2 className="text-[22px] font-extrabold text-ink">Faculty login</h2>
        <p className="lbl mt-1">Sign in with your faculty or admin account to upload result PDFs.</p>
        <div className="mt-4">
          <FacultyLoginForm onSuccess={onClose} />
        </div>
        <p className="lbl mt-4 text-center text-xs">Student results are public lookup — no student login required.</p>
      </div>
    </div>
  );
}
