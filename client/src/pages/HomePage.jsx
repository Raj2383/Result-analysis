import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUploadCloud } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import Shell from './_Shell.jsx';
import Button from '../components/ui/Button.jsx';
import ShaderHeroCanvas from '../components/ui/ShaderHeroCanvas.jsx';
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
  const { isOpen, close } = useDisclosure(false);
  const [enrollment, setEnrollment] = useState('');
  const [semester, setSemester] = useState('1');

  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  const { data: overview } = useQuery({ queryKey: ['overview'], queryFn: getOverviewApi });
  const kpis = overview?.kpis;
  const evaluated = Number(kpis?.passed ?? 0) + Number(kpis?.failed ?? 0);
  const passRate = evaluated > 0 ? `${((Number(kpis?.passed ?? 0) / evaluated) * 100).toFixed(1)}%` : '—';
  const availableCourses = (overview?.programmes || []).filter((p) => Number(p.student_count) > 0);

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
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1a3b] via-[#152a61] to-[#1e3a8a] p-8 text-white shadow-xl sm:p-12 lg:p-14 border border-white/10">
        {/* Interactive WebGL GLSL Shader Background */}
        <ShaderHeroCanvas className="opacity-80" />

        <div className="relative z-10">
          <h1 className="h1 m-0 text-white tracking-tight drop-shadow-sm">Analyze GGSIPU results in seconds</h1>
          <p className="mt-3 max-w-[620px] text-base sm:text-[17px] leading-relaxed text-white/90 drop-shadow-sm">
            Upload the university result PDF. We extract every subject&apos;s marks, compute SGPA and CGPA, and rank toppers.
          </p>

          <form onSubmit={submitLookup} className="mt-8 flex flex-wrap items-center gap-3.5 sm:gap-4">
            <label htmlFor="enrollment" className="sr-only">
              Enrollment number
            </label>
            <input
              id="enrollment"
              className="input min-w-[200px] flex-1 border-white/20 bg-white/95 text-ink shadow-sm placeholder:text-ink-soft/70 focus:bg-white"
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
              className="input min-w-[150px] flex-none border-white/20 bg-white/95 text-ink sm:w-[180px] shadow-sm focus:bg-white"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
            <Button variant="accent" type="submit" size="lg" className="shrink-0 font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all">
              <FiSearch aria-hidden /> Search
            </Button>
          </form>

          {availableCourses.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px] text-white/90">
              <span className="font-semibold text-white/80">Available Courses:</span>
              {availableCourses.map((p) => (
                <span
                  key={p.code}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-xs backdrop-blur-md transition-all shadow-sm"
                  title={`${p.name || p.short_name} (${Number(p.student_count).toLocaleString()} students)`}
                >
                  <span>{p.short_name || p.code}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                    ({Number(p.student_count).toLocaleString()})
                  </span>
                </span>
              ))}
              <span className="text-white/70 ml-1">· Public enrollment lookup</span>
            </div>
          )}
        </div>
      </section>

      {/* Upload section – only shown after authenticated successfully as faculty or admin */}
      {isFaculty && (
        <section className="mt-8 sm:mt-10 animate-fade-in">
          <div className="rounded-2xl border-2 border-dashed border-brand/40 bg-surface p-8 sm:p-12 text-center shadow-sm">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand mb-3">
              Authenticated Faculty / Admin Access
            </span>
            <h2 className="h2">Result PDF Upload Console</h2>
            <p className="lbl mt-2 max-w-lg mx-auto">
              Faculty: upload the university result PDF to parse marks, calculate SGPA/CGPA, and update university rankings.
            </p>
            <Button to="/upload" variant="accent" size="lg" className="mt-6 font-semibold shadow-sm inline-flex items-center gap-2">
              <FiUploadCloud aria-hidden /> Open Upload Console
            </Button>
            <p className="lbl mt-4 text-xs">One PDF · secure faculty upload</p>
          </div>
        </section>
      )}

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

      <section className="mt-8 sm:mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="card p-6 sm:p-7">
            <div className="stat">{s.v}</div>
            <div className="lbl mt-1.5">{s.l}</div>
          </div>
        ))}
      </section>

      <AuthModal isOpen={isOpen} onClose={close} />
    </Shell>
  );
}
