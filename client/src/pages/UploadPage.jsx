import { useState } from 'react';
import { FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import Shell from './_Shell.jsx';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import PdfDropzone from '../features/upload/components/PdfDropzone.jsx';
import Table from '../components/ui/Table.jsx';
import { useUploadHistory, useDeleteUpload } from '../features/upload/hooks/useUpload.js';
import { useAuth } from '../features/auth/context/AuthContext.jsx';

function UploadInner() {
  const { data, isLoading, isError } = useUploadHistory();
  const deleteMutation = useDeleteUpload();
  const { user } = useAuth();
  const [targetUpload, setTargetUpload] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const canDelete = user?.role === 'admin' || user?.role === 'faculty';

  const handleDelete = async () => {
    if (!targetUpload) return;
    try {
      await deleteMutation.mutateAsync(targetUpload.id);
      setFeedback({ type: 'success', text: `Upload #${targetUpload.id} ("${targetUpload.filename}") deleted successfully.` });
      setTargetUpload(null);
    } catch (err) {
      setFeedback({ type: 'error', text: err?.response?.data?.message || err.message || 'Failed to delete upload.' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'filename', label: 'File' },
    { key: 'uploaded_by', label: 'Uploaded by' },
    {
      key: 'created_at',
      label: 'Uploaded at',
      render: (val) => (val ? new Date(val).toLocaleString() : '—'),
    },
    ...(canDelete
      ? [
          {
            key: 'actions',
            label: 'Action',
            render: (_val, row) => (
              <button
                type="button"
                onClick={() => setTargetUpload(row)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-bad border border-bad/30 rounded-lg hover:bg-bad/10 active:scale-95 transition-all"
                title={`Delete upload #${row.id}`}
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <Shell title="Upload Result PDF" subtitle="Faculty/admin only — drop a result PDF and watch the pipeline ingest it.">
      <PdfDropzone />

      <div className="card mt-8 sm:mt-10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="h2">Upload history</h2>
          {canDelete && (
            <span className="text-xs text-ink-soft bg-surface px-2.5 py-1 rounded-full border border-line">
              Role: <strong className="text-ink capitalize">{user?.role}</strong> (can delete uploads)
            </span>
          )}
        </div>

        {feedback && (
          <div
            className={`p-3.5 mb-4 text-xs font-medium rounded-lg border flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-good/10 text-good border-good/20'
                : 'bg-bad/10 text-bad border-bad/20'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="ml-3 text-ink-soft hover:text-ink font-bold"
            >
              ×
            </button>
          </div>
        )}

        <div className="mt-4">
          {isLoading && <p className="py-4 text-sm text-ink-soft">Loading history…</p>}
          {isError && <p role="alert" className="py-4 text-sm text-bad">Could not load history.</p>}
          {data && data.items.length === 0 && <p className="py-4 text-sm text-ink-soft">No uploads yet.</p>}
          {data && data.items.length > 0 && <Table columns={columns} rows={data.items} />}
        </div>
      </div>

      {/* Confirmation Modal */}
      {targetUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full p-6 shadow-2xl border border-bad/20 bg-surface">
            <div className="flex items-center gap-3 text-bad mb-3">
              <div className="w-10 h-10 rounded-full bg-bad/10 flex items-center justify-center shrink-0">
                <FiAlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-ink">Delete Upload #{targetUpload.id}?</h3>
            </div>
            <p className="text-sm text-ink-soft mb-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-ink">{targetUpload.filename}</strong>?
            </p>
            <p className="text-xs text-ink-soft bg-surface-alt/60 p-3 rounded-lg border border-line mb-6">
              ⚠️ This will remove all associated student results, exams, and subject marks ingested from this PDF, and recalculate university rankings.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTargetUpload(null)}
                disabled={deleteMutation.isPending}
                className="btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="btn bg-bad text-white hover:bg-bad/90 active:scale-95 px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>{deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete Upload'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

export default function UploadPage() {
  return (
    <ProtectedRoute allowedRoles={['faculty', 'admin']}>
      <UploadInner />
    </ProtectedRoute>
  );
}
