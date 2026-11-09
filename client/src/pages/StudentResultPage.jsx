import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiAlertCircle, FiLoader } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import Shell from './_Shell.jsx';
import Button from '../components/ui/Button.jsx';
import Table from '../components/ui/Table.jsx';
import { getStudentResultApi } from '../features/results/api/resultApi.js';

function fmt(v, fallback = '—') {
  if (v === null || v === undefined || v === '') return fallback;
  return v;
}

export default function StudentResultPage() {
  const navigate = useNavigate();
  const { rollNo: routeRollNo } = useParams();
  const [searchParams] = useSearchParams();
  const semesterParam = Number(searchParams.get('sem')) || undefined;

  const [enrollment, setEnrollment] = useState(routeRollNo || '');
  const [semester, setSemester] = useState(String(semesterParam || ''));

  useEffect(() => {
    setEnrollment(routeRollNo || '');
    setSemester(String(semesterParam || ''));
  }, [routeRollNo, semesterParam]);

  const trimmed = enrollment.trim();
  const semNum = semester ? Number(semester) : undefined;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['result', trimmed, semNum],
    queryFn: () => getStudentResultApi(trimmed, semNum),
    enabled: trimmed.length > 0,
  });

  const submit = (e) => {
    e.preventDefault();
    const roll = enrollment.trim();
    if (!roll) return;
    navigate(`/result/${roll}${semester ? `?sem=${semester}` : ''}`);
  };

  const student = data?.student;
  const summary = data?.summary;
  const marks = data?.marks ?? summary?.marks ?? [];

  const name = student?.name || student?.student_name || summary?.name || (trimmed ? `Enrollment ${trimmed}` : 'Student');
  const inst = student?.inst_name || student?.institution_name || student?.inst_code || summary?.inst_name || summary?.institution_code || '';
  const roll = student?.roll_no || student?.enrollment_no || routeRollNo || trimmed;

  const markRows = (marks || []).map((m) => {
    const total = m.total ?? m.marks_obtained ?? 0;
    const pass = m.is_absent ? false : Number(total) >= 40 || String(m.grade || '').toUpperCase() === 'P';
    const status = m.is_absent ? 'ABSENT' : pass ? 'PASS' : 'FAIL';
    return {
      subject: m.paper_name || m.subject_name || m.paper_code || m.subject_code || `Paper ${m.paper_id ?? '—'}`,
      internal: fmt(m.internal ?? m.minor ?? m.internal_marks),
      external: fmt(m.external ?? m.major ?? m.external_marks),
      total: fmt(total),
      grade: m.grade ?? '—',
      status,
    };
  });

  const rankLine = [
    summary?.overall_rank != null ? `Overall #${summary.overall_rank}` : null,
    summary?.college_rank != null ? `College #${summary.college_rank}` : null,
    summary?.university_rank != null ? `University #${summary.university_rank}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Shell title="Student Result" subtitle="Search by enrollment number to see subject-wise marks, SGPA and CGPA.">
      <form onSubmit={submit} className="mb-8 flex flex-wrap items-center gap-3.5 sm:gap-4">
        <label htmlFor="enrollment" className="sr-only">
          Enrollment number
        </label>
        <input
          id="enrollment"
          className="input min-w-[180px] flex-1"
          placeholder="Enrollment no. e.g. 01011502024"
          value={enrollment}
          onChange={(e) => setEnrollment(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
        />
        <label htmlFor="semester" className="sr-only">
          Semester
        </label>
        <select id="semester" className="input min-w-[160px] flex-none sm:w-[190px]" value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="">All semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
        <Button variant="accent" type="submit" size="md" className="px-6 font-semibold">
          Search
        </Button>
      </form>

      {isLoading && (
        <p className="flex items-center gap-2 text-sm text-ink-soft py-4">
          <FiLoader aria-hidden className="animate-spin" /> Loading result…
        </p>
      )}

      {isError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-bad py-4">
          <FiAlertCircle aria-hidden /> {error?.response?.data?.message || 'Could not load the student result.'}
        </p>
      )}

      {data && (
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="card p-6 sm:p-8">
            <h2 className="h2">{name}</h2>
            <div className="lbl mt-1.5">
              Enrollment {roll}
              {inst ? ` · ${inst}` : ''}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3.5 rounded-xl border border-line/60 bg-surface/50 p-4">
              <div>
                <div className="stat">{fmt(summary?.sgpa, '0')}</div>
                <div className="lbl mt-0.5">SGPA{summary?.semester ? ` Sem ${summary.semester}` : ''}</div>
              </div>
              <div>
                <div className="stat">{fmt(summary?.cgpa, '0')}</div>
                <div className="lbl mt-0.5">CGPA</div>
              </div>
              <div>
                <div className="stat text-accent">{fmt(summary?.percentage ?? summary?.cgpa, '—')}</div>
                <div className="lbl mt-0.5">{summary?.percentage != null ? 'Percentage' : 'Score'}</div>
              </div>
            </div>

            <div className="formula mt-5">
              SGPA = Σ(credit × grade point) ÷ Σ credits
              <br />
              CGPA = Σ(SGPA × sem credits) ÷ Σ credits
            </div>
            {rankLine ? <p className="lbl mt-5 border-t border-line/60 pt-4 font-medium text-ink">{rankLine}</p> : null}
          </div>

          <div className="card p-6 sm:p-8">
            <h2 className="h2 mb-4">{summary?.semester ? `Semester ${summary.semester} marks` : 'Subject-wise marks'}</h2>
            {markRows.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">No marks were parsed for this enrollment.</p>
            ) : (
              <div className="mt-2">
                <Table
                  columns={[
                    { key: 'subject', label: 'Subject' },
                    { key: 'internal', label: 'Int.', numeric: true },
                    { key: 'external', label: 'Ext.', numeric: true },
                    { key: 'total', label: 'Total', numeric: true },
                    { key: 'grade', label: 'Grade' },
                    { key: 'status', label: 'Status' },
                  ]}
                  rows={markRows.map((r) => ({
                    ...r,
                    grade:
                      r.status === 'PASS' || r.status === 'ABSENT' ? (
                        <span className={`pill ${r.status === 'ABSENT' ? 'pill-bad' : 'pill-ok'}`}>{r.grade}</span>
                      ) : (
                        <span className="pill pill-bad">{r.grade}</span>
                      ),
                    status:
                      r.status === 'PASS' ? (
                        <span className="pill pill-ok">PASS</span>
                      ) : (
                        <span className="pill pill-bad">{r.status}</span>
                      ),
                  }))}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
