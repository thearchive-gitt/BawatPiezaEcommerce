export default function LoadingTile({
  label = "Loading",
  detail = "Preparing your Bawat Pieza experience.",
}: {
  label?: string;
  detail?: string;
}) {
  return (
    <div aria-live="polite" className="loading-tile" role="status">
      <div className="loading-tile-art" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className="loading-tile-detail">{detail}</p>
      </div>
    </div>
  );
}
