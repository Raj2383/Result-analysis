import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUploadCloud } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import Shell from './_Shell.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../features/auth/context/AuthContext.jsx';
import AuthModal from '../features/auth/components/AuthModal.jsx';
import useDisclosure from '../hooks/useDisclosure.js';
import { getOverviewApi } from '../features/overview/api/overviewApi.js';

const STEPS = [
  { n: '1', label: 'Upload PDF' },
  { n: '2', label: 'Extract marks' },
  { n: '3', label: 'Calculate SGPA & CGPA' },
  { n: '4', label: 'View rankings' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen, open, close } = useDisclosure(false);
  const [enrollment, setEnrollment] = useState('');
  const [semester, setSemester] = useState('1');

  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  const { data: overview } = useQuery({ queryKey: ['overview'], queryFn: getOverviewApi });
  const kpis = overview?.kpis;
  const evaluated = Number(kpis?.passed ?? 0) + Number(kpis?.failed ?? 0);
  const passRate = evaluated > 0 ? `${((Number(kpis?.passed ?? 0) / evaluated) * 100).toFixed(1)}%` : '—';
  const stats = overview
    ? [
        { v: String(kpis?.students ?? 0), l: 'Students parsed' },
        { v: String(overview.institutions?.length ?? 0), l: 'Colleges' },
        { v: Number(kpis?.avg_cgpa ?? 0).toFixed(2), l: 'Average CGPA' },
        { v: passRate, l: 'Pass rate' },
      ]
    : [
        { v: '—', l: 'Students parsed' },
        { v: '—', l: 'Colleges' },
        { v: '—', l: 'Average CGPA' },
        { v: '—', l: 'Pass rate' },
      ];

  const submitLookup = (e) => {
    e.preventDefault();
    const roll = enrollment.trim();
    if (!roll) return;
    navigate(`/result/${roll}?sem=${semester}`);
  };

  return (
    <Shell>
      <section className="rounded-2xl bg-gradient-to-br from-brand to-brand-light p-8 text-white shadow-sm sm:p-12 lg:p-14">
        <h1 className="h1 m-0 text-white">Analyze GGSIPU results in seconds</h1>
        <p className="mt-3 max-w-[620px] text-base sm:text-[17px] leading-relaxed text-white/90">
          Upload the university result PDF. We extract every subject&apos;s marks, compute SGPA and CGPA, and rank toppers.
        </p>

        <form onSubmit={submitLookup} className="mt-8 flex flex-wrap items-center gap-3.5 sm:gap-4">
          <label htmlFor="enrollment" className="sr-only">
            Enrollment number
          </label>
          <input
            id="enrollment"
            className="input min-w-[200px] flex-1 border-white/20 bg-white/95 text-ink"
            placeholder="Enrollment no. e.g. 01011502024"
            value={enrollment}
            onChange={(e) => setEnrollment(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
          />
          <label htmlFor="semester" className="sr-only">
            Semester
          </label>
          <select
            id="semester"
            className="input min-w-[150px] flex-none border-white/20 bg-white/95 text-ink sm:w-[180px]"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
          <Button variant="accent" type="submit" size="lg" className="shrink-0 font-bold shadow-sm">
            <FiSearch aria-hidden /> Search
          </Button>
        </form>
        <p className="mt-4 text-[13px] text-white/80">Public lookup by enrollment number + semester · no sign-in required</p>
      </section>

      <section className="mt-8 sm:mt-10">
        <div className="rounded-2xl border-2 border-dashed border-brand-light/70 bg-card p-10 text-center shadow-card sm:p-14">
          <h2 className="h2">Result PDF</h2>
          <p className="lbl mt-2 max-w-lg mx-auto">Faculty: upload the university result PDF to parse marks, SGPA/CGPA and rankings</p>
          {isFaculty ? (
            <Button to="/upload" variant="accent" size="lg" className="mt-6 font-semibold shadow-sm">
              <FiUploadCloud aria-hidden /> Open Upload Console
            </Button>
          ) : (
            <Button variant="accent" size="lg" onClick={open} className="mt-6 font-semibold shadow-sm">
              Sign in to upload
            </Button>
          )}
          <p className="lbl mt-4">One PDF · secure faculty upload</p>
        </div>
      </section>

      <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-x-8 gap-y-3.5 text-sm text-ink-soft">
        {STEPS.map((s) => (
          <span key={s.n} className="inline-flex items-center gap-2.5">
            <b className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-sm">
              {s.n}
            </b>
            {s.label}
          </span>
        ))}
      </div>

      <div className="mt-8 sm:mt-10 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="card p-6 sm:p-7">
            <div className="stat">{s.v}</div>
            <div className="lbl mt-1.5">{s.l}</div>
          </div>
        ))}
      </div>

      <AuthModal isOpen={isOpen} onClose={close} />
    </Shell>
  );
}
