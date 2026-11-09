import Header from '../components/layout/Header.jsx';

export default function Shell({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <Header />
      <main className="mx-auto w-full max-w-[1050px] flex-1 px-4 py-6 pb-12 sm:px-5">
        {title ? (
          <div className="mb-5">
            <h1 className="text-[30px] font-extrabold leading-tight text-ink">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-ink-soft">{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
      </main>
      <footer className="border-t border-line bg-card/60">
        <div className="mx-auto max-w-[1050px] px-4 py-6 text-center text-xs text-ink-soft sm:px-5">
          ResultLens · GGSIPU Result Analyzer &amp; CGPA Calculator · Faculty uploads · Public enrollment lookup
        </div>
      </footer>
    </div>
  );
}
