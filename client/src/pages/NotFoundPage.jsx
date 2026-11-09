import Button from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
      <div className="card mx-auto max-w-xl p-10 sm:p-14">
        <p className="text-6xl sm:text-7xl font-extrabold tracking-tight text-brand">404</p>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-ink">Page not found</h1>
        <p className="lbl mt-3 text-base">The page you are looking for does not exist or has moved.</p>
        <Button to="/" size="lg" className="mt-8 font-semibold shadow-sm">
          Back to home
        </Button>
      </div>
    </div>
  );
}
