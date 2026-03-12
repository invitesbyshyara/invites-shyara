interface DirectionsButtonProps {
  address: string;
}

const DirectionsButton = ({ address }: DirectionsButtonProps) => (
  <a
    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-sm font-body transition-colors"
  >
    📍 Directions
  </a>
);

export default DirectionsButton;
