export default function UploadProgress({ progress }) {
  return (
    <div className="w-full" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div className="bar">
        <i style={{ width: `${progress}%` }} />
      </div>
      <p className="lbl mt-1.5">Uploading… {progress}%</p>
    </div>
  );
}
