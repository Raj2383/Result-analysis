import { NavLink, Link } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import AuthModal from '../../features/auth/components/AuthModal.jsx';
import useDisclosure from '../../hooks/useDisclosure.js';

const linkCls = ({ isActive }) =>
  `whitespace-nowrap rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-sm font-semibold transition-all duration-150 ${
    isActive ? 'bg-brand text-white shadow-sm' : 'text-ink-soft hover:bg-surface hover:text-ink'
  }`;

const mobileLinkCls = ({ isActive }) =>
  `flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
    isActive ? 'bg-brand text-white' : 'text-ink-soft hover:bg-surface hover:text-ink'
  }`;

export default function Header() {
  const { user, logout } = useAuth();
  const { isOpen, open, close } = useDisclosure(false);
  const { isOpen: menuOpen, open: openMenu, close: closeMenu } = useDisclosure(false);
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-card/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4.5 lg:px-8">
        <div className="flex items-center gap-6 md:gap-8 lg:gap-12">
          <Link to="/" className="text-[20px] sm:text-[22px] font-extrabold tracking-tight text-brand shrink-0">
            Result<span className="text-accent">Lens</span>
          </Link>

          <div className="hidden items-center gap-2.5 md:gap-3 lg:gap-5 md:flex">
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
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {user ? (
            <>
              <span className="hidden max-w-[12rem] truncate text-right text-[13px] font-semibold leading-tight text-ink lg:block">
                {user.name || user.username}
                <small className="block font-normal text-ink-soft mt-0.5">{user.role}</small>
              </span>
              <Button variant="ghost" size="sm" aria-label="Log out" onClick={() => logout()}>
                <FiLogOut aria-hidden /> <span className="hidden sm:inline">Log out</span>
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={open}>
              Sign in / Login
            </Button>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-card text-ink transition-colors hover:bg-surface md:hidden"
            onClick={menuOpen ? closeMenu : openMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <FiX aria-hidden /> : <FiMenu aria-hidden />}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="border-t border-line/80 bg-card px-5 py-5 md:hidden shadow-lg">
          <div className="flex flex-col gap-2">
            <NavLink to="/" end className={mobileLinkCls} onClick={closeMenu}>
              Home
            </NavLink>
            <NavLink to="/result" className={mobileLinkCls} onClick={closeMenu}>
              Student Result
            </NavLink>
            <NavLink to="/toppers" className={mobileLinkCls} onClick={closeMenu}>
              Toppers
            </NavLink>
            <NavLink to="/analytics" className={mobileLinkCls} onClick={closeMenu}>
              Analytics
            </NavLink>
            {isFaculty ? (
              <NavLink to="/upload" className={mobileLinkCls} onClick={closeMenu}>
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
