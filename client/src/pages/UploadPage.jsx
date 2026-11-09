import Shell from './_Shell.jsx';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import PdfDropzone from '../features/upload/components/PdfDropzone.jsx';
import Table from '../components/ui/Table.jsx';
import { useUploadHistory } from '../features/upload/hooks/useUpload.js';

function UploadInner() {
  const { data, isLoading, isError } = useUploadHistory();
  return (
    <Shell title="Upload Result PDF" subtitle="Faculty/admin only — drop a result PDF and watch the pipeline ingest it.">
      <PdfDropzone />
      <div className="card mt-5 p-5">
        <h2 className="text-lg font-bold text-ink">Upload history</h2>
        <div className="mt-3">
          {isLoading && <p className="text-sm text-ink-soft">Loading history…</p>}
          {isError && <p role="alert" className="text-sm text-bad">Could not load history.</p>}
          {data && data.items.length === 0 && <p className="text-sm text-ink-soft">No uploads yet.</p>}
          {data && data.items.length > 0 && (
            <Table
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'filename', label: 'File' },
                { key: 'uploaded_by', label: 'Uploaded by' },
                { key: 'created_at', label: 'Uploaded at' },
              ]}
              rows={data.items}
            />
          )}
        </div>
      </div>
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
