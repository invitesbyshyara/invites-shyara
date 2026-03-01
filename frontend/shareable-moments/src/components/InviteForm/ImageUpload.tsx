import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  value: string | string[] | null;
  onChange: (val: string | string[]) => void;
  multiple?: boolean;
  max?: number;
}

const ImageUpload = ({ value, onChange, multiple = false, max = 10 }: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPreviews: string[] = [];
    Array.from(files).forEach(file => {
      if (newPreviews.length + previews.length >= max && multiple) return;
      newPreviews.push(URL.createObjectURL(file));
    });

    if (multiple) {
      const all = [...previews, ...newPreviews].slice(0, max);
      setPreviews(all);
      onChange(all);
    } else {
      setPreviews(newPreviews.slice(0, 1));
      onChange(newPreviews[0] || '');
    }
  };

  const removeImage = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onChange(multiple ? updated : updated[0] || '');
  };

  return (
    <div className="space-y-3">
      {previews.length > 0 && (
        <div className={`grid gap-2 ${multiple ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1'}`}>
          {previews.map((src, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {(multiple ? previews.length < max : previews.length === 0) && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-gold/50 hover:bg-accent/30 transition-colors"
        >
          <p className="text-sm text-muted-foreground font-body">
            {multiple ? `Click to add photos (${previews.length}/${max})` : 'Click to upload a photo'}
          </p>
          <p className="text-xs text-muted-foreground/60 font-body mt-1">JPG, PNG, WebP</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={e => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
