import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';

interface SlugPickerProps {
  value: string;
  onChange: (slug: string) => void;
  suggestion?: string;
}

const SlugPicker = ({ value, onChange, suggestion }: SlugPickerProps) => {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!value || value.length < 3) {
      setAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await api.checkSlugAvailability(value);
        setAvailable(result.available);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [value]);

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="space-y-2">
      <Label className="font-body text-sm">Custom URL Slug</Label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-body whitespace-nowrap hidden sm:inline">
          {window.location.host}/i/
        </span>
        <Input
          value={value}
          onChange={e => onChange(slugify(e.target.value))}
          placeholder={suggestion || 'your-custom-slug'}
          className="text-sm flex-1"
        />
      </div>
      {value && (
        <div className="flex items-center gap-2">
          {checking ? (
            <span className="text-xs text-muted-foreground font-body">Checking...</span>
          ) : available === true ? (
            <span className="text-xs font-body text-foreground">✓ Available</span>
          ) : available === false ? (
            <span className="text-xs text-destructive font-body">✗ Already taken</span>
          ) : null}
        </div>
      )}
      <p className="text-xs text-muted-foreground font-body">
        Full URL: <span className="text-gold">{window.location.host}/i/{value || '...'}</span>
      </p>
    </div>
  );
};

export default SlugPicker;
