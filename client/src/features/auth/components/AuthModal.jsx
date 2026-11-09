import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import FacultyLoginForm from './FacultyLoginForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Slightly longer than the panel's 170ms exit transition (see globals.css).
const EXIT_UNMOUNT_DELAY_MS = 200;

export default function AuthModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const { loginState } = useAuth();
  // `mounted` keeps the dialog in the DOM during the exit animation;
  // `shown` drives data-state="open" so CSS handles enter/exit.
  const [mounted, setMounted] = useState(isOpen);
  const [shown, setShown] = useState(false);

  // Mount immediately on open; on close, wait out the exit transition.
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      return undefined;
    }
    setShown(false);
    const timer = setTimeout(() => setMounted(false), EXIT_UNMOUNT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Flip data-state only after the closed styles have painted (double rAF),
  // so the enter transition actually runs.
  useEffect(() => {
    if (!isOpen || !mounted) return undefined;
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen || !mounted) return undefined;
    loginState.reset();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    dialogRef.current?.querySelector('input')?.focus();
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="modal-backdrop" data-state={shown ? 'open' : 'closed'} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Faculty login"
        className="modal-panel"
        data-state={shown ? 'open' : 'closed'}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close login dialog"
          className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 hover:bg-surface hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          <FiX size={18} aria-hidden />
        </button>
        <h2 className="h2">Faculty login</h2>
        <p className="lbl mt-1.5">Sign in with your faculty or admin account to upload result PDFs.</p>
        <div className="mt-5">
          <FacultyLoginForm onSuccess={onClose} />
        </div>
        <p className="lbl mt-6 text-center text-xs">Student results are public lookup — no student login required.</p>
      </div>
    </div>,
    document.body
  );
}
