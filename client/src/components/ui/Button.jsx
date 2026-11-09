import { Link } from 'react-router-dom';
import { FiLoader } from 'react-icons/fi';

/*
 * Single reusable button for the whole app – CSS classes (.btn / .btn-*) in
 * styles/globals.css own the styling, this component owns variant/size/behavior.
 * Renders:
 *   - to   → react-router <Link> (internal navigation keeps client-side routing)
 *   - href → <a> (external)
 *   - else → <button>
 */
const VARIANTS = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  ghost: 'btn-ghost',
};

const SIZES = {
  sm: 'px-3.5 py-2 text-[13px]',
  md: '',
  lg: 'px-6 py-3 text-[15px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  to,
  href,
  className = '',
  children,
  ...rest
}) {
  const cls = ['btn', VARIANTS[variant], SIZES[size], className].filter(Boolean).join(' ');

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }

  const block = disabled || loading;
  return (
    <button type={type} className={cls} disabled={block} aria-busy={loading || undefined} {...rest}>
      {loading && <FiLoader aria-hidden className="animate-spin" />}
      {children}
    </button>
  );
}
