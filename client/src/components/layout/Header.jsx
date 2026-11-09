import { NavLink, Link } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import AuthModal from '../../features/auth/components/AuthModal.jsx';
import useDisclosure from '../../hooks/useDisclosure.js';

const linkCls = ({ isActive }) =>
  `whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-brand text-white' : 'text-ink-soft hover:bg-surface hover:text-ink'
  }`;

export default function Header() {
  const { user, logout } = useAuth();
  const { isOpen, open, close } = useDisclosure(false);
  const { isOpen: menuOpen, open: openMenu, close: closeMenu } = useDisclosure(false);
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card">
      <nav className="mx-auto flex max-w-[1050px] flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
        <Link to="/" className="text-[20px] font-extrabold tracking-tight text-brand">
          Result<span className="text-accent">Lens</span>
        </Link>

        <div className="hidden flex-1 items-center gap-1 overflow-x-auto md:flex">
          <NavLink to="/" end className={linkCls}>
            Home
          </NavLink>
          <NavLink to="/result" className={linkCls}>
            Student Result
          </NavLink>
          <NavLink to="/toppers" className={linkCls}>
            Toppers
          </NavLink>
          <NavLink to="/analytics" className={linkCls}>
            Analytics
          </NavLink>
          {isFaculty ? (
            <NavLink to="/upload" className={linkCls}>
              Upload
            </NavLink>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span className="hidden max-w-[11rem] truncate text-right text-[13px] font-semibold leading-tight text-ink lg:block">
                {user.name || user.username}
                <small className="block font-normal text-ink-soft">{user.role}</small>
              </span>
              <button type="button" onClick={() => logout()} className="btn-ghost !px-3.5 !py-2 text-[13px]" aria-label="Log out">
                <FiLogOut aria-hidden /> <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          ) : (
            <button type="button" onClick={open} className="btn-primary !px-[18px] !py-[9px]">
              Sign in / Login
            </button>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-card text-ink md:hidden"
            onClick={menuOpen ? closeMenu : openMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <FiX aria-hidden /> : <FiMenu aria-hidden />}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="border-t border-line bg-card px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" end className={linkCls} onClick={closeMenu}>
              Home
            </NavLink>
            <NavLink to="/result" className={linkCls} onClick={closeMenu}>
              Student Result
            </NavLink>
            <NavLink to="/toppers" className={linkCls} onClick={closeMenu}>
              Toppers
            </NavLink>
            <NavLink to="/analytics" className={linkCls} onClick={closeMenu}>
              Analytics
            </NavLink>
            {isFaculty ? (
              <NavLink to="/upload" className={linkCls} onClick={closeMenu}>
                Upload
              </NavLink>
            ) : null}
          </div>
        </div>
      ) : null}

      <AuthModal isOpen={isOpen} onClose={close} />
    </header>
  );
}
