import { FiBookOpen, FiCalendar } from 'react-icons/fi';

export default function CourseFilterBar({
  courses = [],
  batches = [],
  selectedCourse = '',
  onCourseChange,
  selectedBatch = '',
  onBatchChange,
  selectedSemester = '',
  onSemesterChange,
  showSemester = true,
  selectedCollege = '',
  onCollegeChange,
  institutions = [],
  showCollege = false,
  className = '',
}) {
  return (
    <div className={`card p-4 sm:p-5 mb-6 border border-line/80 shadow-sm bg-surface ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Course Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft mr-1">
            <FiBookOpen className="w-3.5 h-3.5" />
            Course:
          </span>
          <button
            type="button"
            onClick={() => onCourseChange?.('')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              !selectedCourse
                ? 'bg-brand text-white shadow-sm'
                : 'bg-surface-alt text-ink hover:bg-surface-alt/80 border border-line'
            }`}
          >
            All Courses
          </button>
          {courses.map((c) => {
            const isSelected = selectedCourse === c.code || selectedCourse === c.short_name;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => onCourseChange?.(c.code)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-surface-alt text-ink hover:bg-surface-alt/80 border border-line'
                }`}
                title={`${c.name || c.short_name} · ${c.degree_level || 'UG'}`}
              >
                <span>{c.short_name || c.code}</span>
                {c.student_count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-surface text-ink-soft'}`}>
                    {c.student_count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Date / Year / Semester Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Batch / Year Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="filter-batch" className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
              <FiCalendar className="w-3.5 h-3.5" />
              Year/Batch:
            </label>
            <select
              id="filter-batch"
              className="input !py-1.5 !px-3 !text-xs !w-auto min-w-[110px]"
              value={selectedBatch}
              onChange={(e) => onBatchChange?.(e.target.value)}
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Dropdown */}
          {showSemester && (
            <div className="flex items-center gap-2">
              <label htmlFor="filter-semester" className="text-xs font-semibold text-ink-soft">
                Semester:
              </label>
              <select
                id="filter-semester"
                className="input !py-1.5 !px-3 !text-xs !w-auto min-w-[105px]"
                value={selectedSemester}
                onChange={(e) => onSemesterChange?.(e.target.value)}
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* College Dropdown (optional) */}
          {showCollege && (
            <div className="flex items-center gap-2">
              <label htmlFor="filter-college" className="text-xs font-semibold text-ink-soft">
                College:
              </label>
              <select
                id="filter-college"
                className="input !py-1.5 !px-3 !text-xs !w-auto max-w-[200px]"
                value={selectedCollege}
                onChange={(e) => onCollegeChange?.(e.target.value)}
              >
                <option value="">All Colleges</option>
                {institutions.map((i) => {
                  const code = i.code || i.inst_code;
                  const name = i.name || i.inst_name;
                  return (
                    <option key={code} value={code}>
                      {code} · {name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Clear Filters button if any filter is active */}
          {(selectedCourse || selectedBatch || (showSemester && selectedSemester) || (showCollege && selectedCollege)) && (
            <button
              type="button"
              onClick={() => {
                onCourseChange?.('');
                onBatchChange?.('');
                if (showSemester) onSemesterChange?.('');
                if (showCollege) onCollegeChange?.('');
              }}
              className="text-xs text-bad hover:underline font-semibold ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
