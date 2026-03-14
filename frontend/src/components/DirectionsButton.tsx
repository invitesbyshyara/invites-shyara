import { getLiveInviteCopy } from '@/utils/liveInviteCopy';

interface DirectionsButtonProps {
  address: string;
  language?: string;
}

const DirectionsButton = ({ address, language }: DirectionsButtonProps) => {
  const copy = getLiveInviteCopy(language);

  return (
    <a
      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-sm font-body transition-colors"
    >
      📍 {copy.directions}
    </a>
  );
};

export default DirectionsButton;
