import { getLiveInviteCopy } from '@/utils/liveInviteCopy';

interface RegistrySectionProps {
  links: { title: string; url: string }[];
  language?: string;
}

const RegistrySection = ({ links, language }: RegistrySectionProps) => {
  if (!links.length) return null;
  const copy = getLiveInviteCopy(language);

  return (
    <section className="py-12 px-6 bg-background border-t border-border">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-2xl font-bold mb-6">{copy.giftRegistry}</h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full border border-border bg-card font-body text-sm hover:bg-muted transition-colors"
            >
              🎁 {link.title}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegistrySection;
