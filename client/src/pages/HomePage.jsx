import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiUploadCloud } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import Shell from './_Shell.jsx';
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
      <section className="rounded-[14px] border-0 bg-gradient-to-br from-brand to-brand-light p-6 text-white sm:p-8">
        <h1 className="m-0 text-[30px] font-extrabold leading-tight">Analyze GGSIPU results in seconds</h1>
        <p className="mt-1.5 max-w-[560px] text-white/85">
          Upload the university result PDF. We extract every subject&apos;s marks, compute SGPA and CGPA, and rank toppers.
        </p>

        <form onSubmit={submitLookup} className="mt-5 flex flex-wrap gap-2">
          <label htmlFor="enrollment" className="sr-only">
            Enrollment number
          </label>
          <input
            id="enrollment"
            className="input min-w-[180px] flex-1 border-white/20 bg-white/95 text-ink"
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
            className="input min-w-[140px] flex-none border-white/20 bg-white/95 text-ink sm:w-[170px]"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-accent shrink-0">
            <FiSearch aria-hidden /> Search
          </button>
        </form>
        <p className="mt-2.5 text-[13px] text-white/75">Public lookup by enrollment number + semester · no sign-in required</p>
      </section>

      <section className="mt-4">
        <div className="card border-2 border-dashed border-brand-light/70 px-6 py-8 text-center">
          <h2 className="text-lg font-bold text-ink">Result PDF</h2>
          <p className="lbl mt-1">Faculty: upload the university result PDF to parse marks, SGPA/CGPA and rankings</p>
          {isFaculty ? (
            <Link to="/upload" className="btn-accent mt-4 inline-flex">
              <FiUploadCloud aria-hidden /> Open Upload Console
            </Link>
          ) : (
            <button type="button" onClick={open} className="btn-accent mt-4">
              Sign in to upload
            </button>
          )}
          <p className="lbl mt-3">One PDF · secure faculty upload</p>
        </div>
      </section>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-ink-soft">
        {STEPS.map((s) => (
          <span key={s.n} className="inline-flex items-center gap-1.5">
            <b className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">
              {s.n}
            </b>
            {s.label}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="card p-5">
            <div className="stat">{s.v}</div>
            <div className="lbl mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      <AuthModal isOpen={isOpen} onClose={close} />
    </Shell>
  );
}
