import Header from '../components/layout/Header.jsx';

export default function Shell({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <Header />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 sm:px-6 lg:px-8 py-10 sm:py-12 pb-20 sm:pb-24">
        {title ? (
          <div className="mb-8 sm:mb-10">
            <h1 className="h1 text-ink">{title}</h1>
            {subtitle ? <p className="mt-2.5 max-w-2xl text-[15px] sm:text-base leading-relaxed text-ink-soft">{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
      </main>
      <footer className="border-t border-line/80 bg-card/70 mt-auto py-8 sm:py-10">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 text-center text-sm text-ink-soft leading-relaxed">
          ResultLens · GGSIPU Result Analyzer &amp; CGPA Calculator · Faculty uploads · Public enrollment lookup
        </div>
      </footer>
    </div>
  );
}
