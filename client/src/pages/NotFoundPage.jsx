import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-[1050px] px-4 py-20 text-center">
      <div className="card mx-auto max-w-xl p-10">
        <p className="text-6xl font-extrabold text-brand">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Page not found</h1>
        <p className="lbl mt-2">The page you are looking for does not exist or has moved.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Back to home
        </Link>
      </div>
    </div>
  );
}
