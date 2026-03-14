import { getLiveInviteCopy } from '@/utils/liveInviteCopy';

interface AccommodationEntry {
  name: string;
  address: string;
  link?: string;
  groupCode?: string;
  description?: string;
}

interface AccommodationSectionProps {
  entries: AccommodationEntry[];
  language?: string;
}

const AccommodationSection = ({ entries, language }: AccommodationSectionProps) => {
  if (!entries.length) return null;
  const copy = getLiveInviteCopy(language);

  return (
    <section className="py-12 px-6 bg-muted/30 border-t border-border">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-center mb-6">{copy.accommodation}</h2>
        <div className="space-y-4">
          {entries.map((e, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <p className="font-display font-semibold text-lg">{e.name}</p>
              <p className="text-sm text-muted-foreground font-body mt-1">{e.address}</p>
              {e.description && (
                <p className="text-sm font-body mt-2">{e.description}</p>
              )}
              {e.groupCode && (
                <p className="text-xs text-muted-foreground font-body mt-1">
                  {copy.groupCode}: <span className="font-mono font-medium">{e.groupCode}</span>
                </p>
              )}
              {e.link && (
                <a
                  href={e.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-primary font-body hover:underline"
                >
                  {copy.book} →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AccommodationSection;
