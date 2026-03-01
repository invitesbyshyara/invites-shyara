import { useState, useCallback, useMemo, useRef, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TemplateConfig, Invite, TemplateField } from '@/types';
import { api } from '@/services/api';
import { getTemplateRenderer } from '@/templates/registry';
import { useToast } from '@/hooks/use-toast';
import FieldRenderer from './FieldRenderer';
import SlugPicker from './SlugPicker';
import PhoneMockup from '@/components/PhoneMockup';

interface InviteFormProps {
  config: TemplateConfig;
  invite: Invite;
  isEditing?: boolean;
}

const stepDefs = [
  { key: 'basic', label: 'Event Details', sections: ['basic'] },
  { key: 'venue', label: 'Venue & Story', sections: ['venue', 'story'] },
  { key: 'media', label: 'Media & Schedule', sections: ['gallery', 'schedule', 'rsvp', 'settings'] },
  { key: 'review', label: 'Review & Publish', sections: [] },
];

const InviteForm = ({ config, invite, isEditing = false }: InviteFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>(invite.data || {});
  const [slug, setSlug] = useState(invite.slug || '');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [previewData, setPreviewData] = useState<Record<string, any>>(formData);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(() => setPreviewData({ ...formData }), 300);
    return () => clearTimeout(debounceRef.current);
  }, [formData]);

  const handleFieldChange = useCallback((key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  const handleBlur = useCallback((key: string) => {
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  const fieldsByStep = useMemo(() => {
    return stepDefs.map(step =>
      config.fields.filter(f => step.sections.includes(f.section || 'basic'))
    );
  }, [config.fields]);

  const slugSuggestion = useMemo(() => {
    const parts: string[] = [];
    if (formData.brideName && formData.groomName) parts.push(formData.brideName, 'and', formData.groomName);
    else if (formData.partnerOneName && formData.partnerTwoName) parts.push(formData.partnerOneName, 'and', formData.partnerTwoName);
    else if (formData.celebrantName) parts.push(formData.celebrantName, 'birthday');
    else if (formData.eventName) parts.push(formData.eventName);
    else if (formData.coupleNames) parts.push(formData.coupleNames, 'anniversary');
    return parts.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';
  }, [formData]);

  const validateStep = (step: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    const fields = fieldsByStep[step];
    if (!fields) return errs;

    const today = new Date().toISOString().split('T')[0];

    fields.forEach(f => {
      const val = formData[f.key];
      if (f.required && (!val || (typeof val === 'string' && !val.trim()))) {
        errs[f.key] = `${f.label} is required`;
      }
      if (f.type === 'date' && val && val < today) {
        errs[f.key] = 'Date must be in the future';
      }
    });

    // Cross-field: RSVP deadline < event date
    const eventDateField = fields.find(f => f.key.includes('Date') && f.key !== 'rsvpDeadline');
    const rsvpField = fields.find(f => f.key === 'rsvpDeadline');
    if (rsvpField && eventDateField) {
      const eventDate = formData[eventDateField.key];
      const rsvpDate = formData[rsvpField.key];
      if (eventDate && rsvpDate && rsvpDate >= eventDate) {
        errs['rsvpDeadline'] = 'RSVP deadline must be before the event date';
      }
    }

    return errs;
  };

  const handleNext = () => {
    if (currentStep >= 3) return;
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...stepErrors }));
      const allTouched: Record<string, boolean> = {};
      fieldsByStep[currentStep].forEach(f => { allTouched[f.key] = true; });
      setTouched(prev => ({ ...prev, ...allTouched }));
      toast({ title: 'Please fix the errors before proceeding', variant: 'destructive' });
      return;
    }
    setCurrentStep(s => s + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await api.updateInvite(invite.id, { data: formData, slug });
      toast({ title: 'Draft saved!', description: 'Your progress has been saved.' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const missing = config.fields.filter(f => f.required && !formData[f.key]);
    if (missing.length > 0) {
      toast({ title: 'Missing required fields', description: missing.map(f => f.label).join(', '), variant: 'destructive' });
      return;
    }
    if (!slug) {
      toast({ title: 'Please set a URL slug', variant: 'destructive' });
      return;
    }
    setShowPublishConfirm(true);
  };

  const confirmPublish = async () => {
    setShowPublishConfirm(false);
    setPublishing(true);
    try {
      if (isEditing) {
        await api.updateInvite(invite.id, { data: formData, status: 'published', slug });
        toast({ title: 'Invite updated!', description: 'Changes are now live.' });
        navigate('/dashboard');
      } else {
        const result = await api.createInvite({ templateSlug: config.slug, templateCategory: config.category, slug, eventData: formData });
        toast({ title: 'Invite published! 🎉', description: 'Your invitation is now live.' });
        navigate(`/publish-success/${result.id}`);
      }
    } catch {
      toast({ title: 'Failed to publish', variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };

  const TemplateRenderer = useMemo(() => getTemplateRenderer(config.category, config.slug), [config.category, config.slug]);

  const sectionLabels: Record<string, string> = {
    basic: 'Basic Information', venue: 'Venue Details', story: 'Your Story',
    schedule: 'Event Schedule', gallery: 'Photos & Gallery', rsvp: 'RSVP Settings', settings: 'Additional Settings',
  };

  const renderStepFields = () => {
    const fields = fieldsByStep[currentStep];
    if (!fields || fields.length === 0) return null;

    // Group by section within the step
    const groups: Record<string, TemplateField[]> = {};
    fields.forEach(f => {
      const section = f.section || 'basic';
      if (!groups[section]) groups[section] = [];
      groups[section].push(f);
    });

    return Object.entries(groups).map(([section, sectionFields]) => (
      <div key={section} className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-semibold mb-5">{sectionLabels[section] || section}</h3>
        <div className="space-y-5">
          {sectionFields.map(field => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={formData[field.key]}
              onChange={handleFieldChange}
              error={errors[field.key]}
              touched={touched[field.key]}
              onBlur={handleBlur}
            />
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Step Indicator */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {stepDefs.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-semibold transition-colors ${
                    i < currentStep ? 'bg-primary text-primary-foreground' :
                    i === currentStep ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-body hidden sm:inline ${i <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
                {i < stepDefs.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${i < currentStep ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h2 className="font-display text-2xl font-bold">{stepDefs[currentStep].label}</h2>

        {currentStep < 3 ? (
          <>
            {renderStepFields()}
          </>
        ) : (
          /* Step 4: Review & Publish */
          <div className="space-y-6">
            {/* Preview toggle */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`px-4 py-2 rounded-lg text-sm font-body transition-colors ${previewMode === 'mobile' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                📱 Mobile
              </button>
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`px-4 py-2 rounded-lg text-sm font-body transition-colors ${previewMode === 'desktop' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                🖥️ Desktop
              </button>
            </div>

            {/* Live Preview */}
            <div className="rounded-xl border border-border bg-muted overflow-hidden">
              {previewMode === 'mobile' ? (
                <div className="flex justify-center py-8">
                  <PhoneMockup>
                    <div className="h-[600px] overflow-y-auto">
                      <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                        <TemplateRenderer config={config} data={previewData} isPreview />
                      </Suspense>
                    </div>
                  </PhoneMockup>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                    <TemplateRenderer config={config} data={previewData} isPreview />
                  </Suspense>
                </div>
              )}
            </div>

            {/* Slug Picker */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold mb-5">Shareable Link</h3>
              <SlugPicker value={slug} onChange={setSlug} suggestion={slugSuggestion} />
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrev} className="flex-1 font-body">
              ← Previous
            </Button>
          )}
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="flex-1 font-body">
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          {currentStep < 3 ? (
            <Button onClick={handleNext} className="flex-1 font-body">
              Next →
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={publishing} className="flex-1 font-body">
              {publishing ? 'Publishing...' : isEditing ? 'Update & Publish' : 'Publish Invite'}
            </Button>
          )}
        </div>
      </div>

      {/* Publish confirmation modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full shadow-xl animate-scale-in">
            <div className="text-3xl text-center mb-3">🚀</div>
            <h3 className="font-display text-lg font-semibold mb-2 text-center">
              {isEditing ? 'Update & Publish' : 'Publish Invite'}
            </h3>
            <p className="text-sm text-muted-foreground font-body mb-2 text-center">
              {isEditing ? 'Your changes will go live immediately.' : 'Your invite will be live at:'}
            </p>
            {!isEditing && slug && (
              <p className="text-xs text-gold font-body font-medium text-center mb-4 break-all">${window.location.host}/i/{slug}</p>
            )}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1 font-body" onClick={() => setShowPublishConfirm(false)}>Cancel</Button>
              <Button className="flex-1 font-body" onClick={confirmPublish} disabled={publishing}>{publishing ? 'Publishing...' : 'Confirm & Publish'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteForm;
