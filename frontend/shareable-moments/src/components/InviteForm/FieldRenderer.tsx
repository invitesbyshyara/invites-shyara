import { TemplateField } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ScheduleEditor from './ScheduleEditor';
import ImageUpload from './ImageUpload';

interface FieldRendererProps {
  field: TemplateField;
  value: any;
  onChange: (key: string, value: any) => void;
  error?: string;
  touched?: boolean;
  onBlur?: (key: string) => void;
}

const FieldRenderer = ({ field, value, onChange, error, touched, onBlur }: FieldRendererProps) => {
  const handleChange = (val: any) => onChange(field.key, val);
  const handleBlur = () => onBlur?.(field.key);
  const showError = touched && error;

  const errorEl = showError ? (
    <p className="text-[hsl(0,72%,51%)] text-xs mt-1 font-body">{error}</p>
  ) : null;

  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-1.5">
          <Label className="font-body text-sm">
            {field.label}
            {field.required && <span className="text-[hsl(0,72%,51%)] ml-1">*</span>}
          </Label>
          <Input
            value={value || ''}
            onChange={e => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder || field.label}
            maxLength={field.maxLength}
            className={`text-sm ${showError ? 'border-[hsl(0,72%,51%)]' : ''}`}
          />
          {errorEl}
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-1.5">
          <Label className="font-body text-sm">
            {field.label}
            {field.required && <span className="text-[hsl(0,72%,51%)] ml-1">*</span>}
          </Label>
          <Textarea
            value={value || ''}
            onChange={e => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder || field.label}
            maxLength={field.maxLength}
            rows={4}
            className={`text-sm resize-none ${showError ? 'border-[hsl(0,72%,51%)]' : ''}`}
          />
          {errorEl}
        </div>
      );

    case 'date':
      return (
        <div className="space-y-1.5">
          <Label className="font-body text-sm">
            {field.label}
            {field.required && <span className="text-[hsl(0,72%,51%)] ml-1">*</span>}
          </Label>
          <Input
            type="date"
            value={value || ''}
            onChange={e => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={`text-sm ${showError ? 'border-[hsl(0,72%,51%)]' : ''}`}
          />
          {errorEl}
        </div>
      );

    case 'time':
      return (
        <div className="space-y-1.5">
          <Label className="font-body text-sm">
            {field.label}
            {field.required && <span className="text-[hsl(0,72%,51%)] ml-1">*</span>}
          </Label>
          <Input
            type="time"
            value={value || ''}
            onChange={e => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={`text-sm ${showError ? 'border-[hsl(0,72%,51%)]' : ''}`}
          />
          {errorEl}
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1.5">
          <Label className="font-body text-sm">
            {field.label}
            {field.required && <span className="text-[hsl(0,72%,51%)] ml-1">*</span>}
          </Label>
          <Input
            type="number"
            value={value ?? ''}
            onChange={e => handleChange(e.target.value ? Number(e.target.value) : '')}
            onBlur={handleBlur}
            placeholder={field.placeholder || field.label}
            className={`text-sm ${showError ? 'border-[hsl(0,72%,51%)]' : ''}`}
          />
          {errorEl}
        </div>
      );

    case 'url':
      return (
        <div className="space-y-1.5">
          <Label className="font-body text-sm">
            {field.label}
            {field.required && <span className="text-[hsl(0,72%,51%)] ml-1">*</span>}
          </Label>
          <Input
            type="url"
            value={value || ''}
            onChange={e => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder || 'https://...'}
            className={`text-sm ${showError ? 'border-[hsl(0,72%,51%)]' : ''}`}
          />
          {errorEl}
        </div>
      );

    case 'toggle':
      return (
        <div className="flex items-center justify-between py-2">
          <Label className="font-body text-sm">{field.label}</Label>
          <Switch checked={!!value} onCheckedChange={handleChange} />
        </div>
      );

    case 'image':
      return (
        <div className="space-y-1.5">
          <Label className="font-body text-sm">{field.label}</Label>
          <ImageUpload value={value || null} onChange={handleChange} />
        </div>
      );

    case 'images':
      return (
        <div className="space-y-1.5">
          <Label className="font-body text-sm">
            {field.label}
            {field.max && <span className="text-muted-foreground ml-1">(max {field.max})</span>}
          </Label>
          <ImageUpload value={value || []} onChange={handleChange} multiple max={field.max || 10} />
        </div>
      );

    case 'schedule-list':
      return (
        <div className="space-y-1.5">
          <Label className="font-body text-sm">{field.label}</Label>
          <ScheduleEditor value={value || []} onChange={val => handleChange(val)} />
        </div>
      );

    default:
      return null;
  }
};

export default FieldRenderer;
