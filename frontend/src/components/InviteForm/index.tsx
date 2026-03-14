import { useState, useCallback, useMemo, useRef, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock3, Eye, Laptop, Link2, Smartphone, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { TemplateConfig, Invite, TemplateField } from '@/types';
import { api } from '@/services/api';
import { getTemplateRenderer } from '@/templates/registry';
import { useToast } from '@/hooks/use-toast';
import FieldRenderer from './FieldRenderer';
import SlugPicker from './SlugPicker';
import PhoneMockup from '@/components/PhoneMockup';
import { CURATED_TRACKS as MUSIC_TRACKS } from '@/constants/musicTracks';

const SECTION_META: Record<string, { label: string; description: string }> = {
  story: { label: 'Story / Description', description: 'Share your love story or event description.' },
  venue: { label: 'Venue & Location', description: 'Venue name, address, and directions.' },
  schedule: { label: 'Schedule / Timeline', description: 'Timeline of events during the day.' },
  gallery: { label: 'Photo Gallery', description: 'Include photos in your invitation.' },
  rsvp: { label: 'RSVP', description: 'Allow guests to respond to your invitation.' },
};

const MAX_MEAL_OPTIONS = 8;

const normalizeMealOptions = (options: string[]) => {
  const seen = new Set<string>();

  return options.reduce<string[]>((result, option) => {
    const trimmed = option.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) {
      return result;
    }

    seen.add(key);
    result.push(trimmed);
    return result;
  }, []).slice(0, MAX_MEAL_OPTIONS);
};

interface InviteFormProps {
  config: TemplateConfig;
  invite: Invite;
  isEditing?: boolean;
}

const deriveInitialFormData = (data: Record<string, any> | undefined) => {
  const source = data ?? {};
  const rsvpSettings = source.rsvpSettings && typeof source.rsvpSettings === 'object' ? source.rsvpSettings : {};

  return {
    ...source,
    mealOptions: source.mealOptions ?? rsvpSettings.mealOptions,
    rsvpDeadline: source.rsvpDeadline ?? rsvpSettings.deadline,
  };
};

const stepDefs = [
  {
    key: 'basic',
    label: 'Event Details',
    description: 'Start with the names, date, and the first details guests need to see.',
    sections: ['basic'],
  },
  {
    key: 'venue',
    label: 'Venue & Story',
    description: 'Add the venue, your story, and optional guest extras.',
    sections: ['venue', 'story'],
  },
  {
    key: 'media',
    label: 'Media & Schedule',
    description: 'Configure photos, music, the schedule, and RSVP options.',
    sections: ['gallery', 'schedule', 'rsvp', 'settings'],
  },
  {
    key: 'review',
    label: 'Review & Publish',
    description: 'Confirm the final URL, check readiness, and publish.',
    sections: [],
  },
] as const;

const sectionLabels: Record<string, string> = {
  basic: 'Basic Information',
  venue: 'Venue Details',
  story: 'Your Story',
  schedule: 'Event Schedule',
  gallery: 'Photos & Gallery',
  rsvp: 'RSVP Settings',
  settings: 'Additional Settings',
};

const InviteForm = ({ config, invite, isEditing = false }: InviteFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>(deriveInitialFormData(invite.data));
  const [slug, setSlug] = useState(invite.slug || '');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [enabledSections, setEnabledSections] = useState<string[]>(
    invite.data?.enabledSections ?? config.supportedSections
  );
  const [previewData, setPreviewData] = useState<Record<string, any>>(formData);
  const [mealOptionDraft, setMealOptionDraft] = useState('');

  const hasMountedRef = useRef(false);
  const autosaveRef = useRef<ReturnType<typeof setTimeout>>();
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const markDirty = useCallback(() => {
    setAutosaveState((previous) => (previous === 'saving' ? previous : 'idle'));
  }, []);

  const handleSlugChange = useCallback((value: string) => {
    setSlug(value);
    markDirty();
  }, [markDirty]);

  const toggleSection = useCallback((section: string) => {
    setEnabledSections((previous) =>
      previous.includes(section) ? previous.filter((item) => item !== section) : [...previous, section]
    );
    markDirty();
  }, [markDirty]);

  useEffect(() => {
    previewDebounceRef.current = setTimeout(() => setPreviewData({ ...formData }), 300);
    return () => clearTimeout(previewDebounceRef.current);
  }, [formData]);

  useEffect(() => {
    return () => {
      clearTimeout(autosaveRef.current);
      clearTimeout(previewDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      setLastSavedAt(invite.updatedAt);
      return;
    }

    if (publishing) {
      return;
    }

    clearTimeout(autosaveRef.current);
    setAutosaveState('idle');

    autosaveRef.current = setTimeout(async () => {
      setAutosaveState('saving');
      try {
        await api.updateInvite(invite.id, { data: { ...formData, enabledSections }, slug });
        setAutosaveState('saved');
        setLastSavedAt(new Date().toISOString());
      } catch {
        setAutosaveState('error');
      }
    }, 1200);

    return () => clearTimeout(autosaveRef.current);
  }, [enabledSections, formData, invite.id, invite.updatedAt, publishing, slug]);

  const handleFieldChange = useCallback((key: string, value: any) => {
    setFormData((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
    markDirty();
  }, [markDirty]);

  const handleBlur = useCallback((key: string) => {
    setTouched((previous) => ({ ...previous, [key]: true }));
  }, []);

  const configuredMealOptions = useMemo(() => {
    const raw = Array.isArray(formData.mealOptions)
      ? formData.mealOptions.filter((item): item is string => typeof item === 'string')
      : [];

    return normalizeMealOptions(raw);
  }, [formData.mealOptions]);

  const addMealOption = useCallback(() => {
    const nextOption = mealOptionDraft.trim();
    if (!nextOption) {
      toast({ title: 'Enter a meal option first', variant: 'destructive' });
      return;
    }

    if (configuredMealOptions.length >= MAX_MEAL_OPTIONS) {
      toast({ title: `You can add up to ${MAX_MEAL_OPTIONS} meal options`, variant: 'destructive' });
      return;
    }

    if (configuredMealOptions.some((option) => option.toLowerCase() === nextOption.toLowerCase())) {
      toast({ title: 'That meal option already exists', variant: 'destructive' });
      return;
    }

    handleFieldChange('mealOptions', [...configuredMealOptions, nextOption]);
    setMealOptionDraft('');
  }, [configuredMealOptions, handleFieldChange, mealOptionDraft, toast]);

  const removeMealOption = useCallback((optionToRemove: string) => {
    const nextOptions = configuredMealOptions.filter((option) => option.toLowerCase() !== optionToRemove.toLowerCase());
    handleFieldChange('mealOptions', nextOptions.length > 0 ? nextOptions : undefined);
  }, [configuredMealOptions, handleFieldChange]);

  const fieldsByStep = useMemo(() => {
    return stepDefs.map((step) =>
      config.fields.filter((field) => step.sections.includes(field.section || 'basic'))
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
    const stepErrors: Record<string, string> = {};
    const stepFields = fieldsByStep[step];
    if (!stepFields) return stepErrors;

    const today = new Date().toISOString().split('T')[0];

    stepFields.forEach((field) => {
      const fieldSection = field.section === 'basic' ? 'hero' : (field.section ?? 'basic');
      if (fieldSection !== 'hero' && fieldSection !== 'settings' && !enabledSections.includes(fieldSection)) {
        return;
      }

      const value = formData[field.key];
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        stepErrors[field.key] = `${field.label} is required`;
      }

      if (field.type === 'date' && value && value < today && !isEditing) {
        stepErrors[field.key] = 'Date must be in the future';
      }
    });

    const eventDateField = stepFields.find((field) => field.key.includes('Date') && field.key !== 'rsvpDeadline');
    const rsvpField = stepFields.find((field) => field.key === 'rsvpDeadline');

    if (eventDateField && rsvpField) {
      const eventDate = formData[eventDateField.key];
      const rsvpDate = formData[rsvpField.key];
      if (eventDate && rsvpDate && rsvpDate >= eventDate) {
        stepErrors.rsvpDeadline = 'RSVP deadline must be before the event date';
      }
    }

    return stepErrors;
  };

  const handleNext = () => {
    if (currentStep >= stepDefs.length - 1) return;

    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((previous) => ({ ...previous, ...stepErrors }));
      const allTouched: Record<string, boolean> = {};
      fieldsByStep[currentStep].forEach((field) => {
        allTouched[field.key] = true;
      });
      setTouched((previous) => ({ ...previous, ...allTouched }));
      toast({ title: 'Please fix the errors before proceeding', variant: 'destructive' });
      return;
    }

    setCurrentStep((step) => step + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  const handleSaveDraft = async () => {
    clearTimeout(autosaveRef.current);
    setSaving(true);
    
    try {
      await api.updateInvite(invite.id, { data: { ...formData, enabledSections }, slug });
      setAutosaveState('saved');
      setLastSavedAt(new Date().toISOString());
      toast({ title: 'Draft saved', description: 'Your progress has been saved.' });
    } catch {
      setAutosaveState('error');
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const missing = config.fields.filter((field) => {
      if (!field.required) return false;
      const fieldSection = field.section === 'basic' ? 'hero' : (field.section ?? 'basic');
      if (fieldSection !== 'hero' && fieldSection !== 'settings' && !enabledSections.includes(fieldSection)) {
        return false;
      }
      return !formData[field.key];
    });

    if (missing.length > 0) {
      toast({
        title: 'Missing required fields',
        description: missing.map((field) => field.label).join(', '),
        variant: 'destructive',
      });
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
    clearTimeout(autosaveRef.current);
    setPublishing(true);
    const dataToSave = { ...formData, enabledSections };

    try {
      if (isEditing) {
        await api.updateInvite(invite.id, { data: dataToSave, status: 'published', slug });
        toast({ title: 'Invite updated', description: 'Changes are now live.' });
        navigate('/dashboard');
      } else {
        const result = await api.createInvite({
          templateSlug: config.slug,
          templateCategory: config.category,
          slug,
          eventData: dataToSave,
        });
        toast({ title: 'Invite published', description: 'Your invitation is now live.' });
        navigate(`/publish-success/${result.id}`);
      }
      setAutosaveState('saved');
      setLastSavedAt(new Date().toISOString());
    } catch {
      toast({ title: 'Failed to publish', variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };

  const TemplateRenderer = useMemo(() => getTemplateRenderer(config.category, config.slug), [config.category, config.slug]);

  const effectiveConfig = useMemo(() => ({
    ...config,
    supportedSections: config.supportedSections.filter((section) => enabledSections.includes(section)),
  }), [config, enabledSections]);

  const requiredFields = useMemo(() => {
    return config.fields.filter((field) => {
      if (!field.required) return false;
      const fieldSection = field.section === 'basic' ? 'hero' : (field.section ?? 'basic');
      if (fieldSection !== 'hero' && fieldSection !== 'settings' && !enabledSections.includes(fieldSection)) {
        return false;
      }
      return true;
    });
  }, [config.fields, enabledSections]);

  const completedRequiredFields = useMemo(() => {
    return requiredFields.filter((field) => {
      const value = formData[field.key];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return Boolean(value);
    }).length;
  }, [formData, requiredFields]);

  const completionPercent = requiredFields.length === 0
    ? 100
    : Math.round((completedRequiredFields / requiredFields.length) * 100);

  const saveStatusLabel =
    autosaveState === 'saving' ? 'Saving changes...' :
    autosaveState === 'saved' ? `Saved${lastSavedAt ? ` ${new Date(lastSavedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}` :
    autosaveState === 'error' ? 'Autosave failed' :
    'Unsaved changes';

  const saveStatusVariant =
    autosaveState === 'error' ? 'destructive' :
    autosaveState === 'saved' ? 'secondary' :
    'outline';

  const isPastEvent = useMemo(() => {
    const eventDate = (formData.eventDate ?? formData.weddingDate ?? formData.partyDate ?? '') as string;
    return Boolean(eventDate) && eventDate < new Date().toISOString().split('T')[0];
  }, [formData.eventDate, formData.partyDate, formData.weddingDate]);

  const publishChecks = useMemo(() => [
    {
      label: 'Required details added',
      detail: `${completedRequiredFields} of ${requiredFields.length} required fields ready`,
      complete: requiredFields.length === 0 || completedRequiredFields === requiredFields.length,
    },
    {
      label: 'Shareable link selected',
      detail: slug ? `${window.location.host}/i/${slug}` : 'Set your invite URL before publishing',
      complete: Boolean(slug),
    },
    {
      label: 'Sections configured',
      detail: `${enabledSections.length} guest-facing section${enabledSections.length === 1 ? '' : 's'} enabled`,
      complete: enabledSections.length > 0,
    },
  ], [completedRequiredFields, enabledSections.length, requiredFields.length, slug]);

  const previewContent = (
    <div className="rounded-2xl border border-border bg-muted overflow-hidden">
      {previewMode === 'mobile' ? (
        <div className="flex justify-center py-8">
          <PhoneMockup>
            <div className="h-[600px] overflow-y-auto">
              <Suspense
                fallback={
                  <div className="min-h-[400px] flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                <TemplateRenderer config={effectiveConfig} data={previewData} isPreview />
              </Suspense>
            </div>
          </PhoneMockup>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto bg-background">
          <Suspense
            fallback={
              <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <TemplateRenderer config={effectiveConfig} data={previewData} isPreview />
          </Suspense>
        </div>
      )}
    </div>
  );

  const renderStepFields = () => {
    const fields = fieldsByStep[currentStep];
    if (!fields || fields.length === 0) return null;

    const groups: Record<string, TemplateField[]> = {};
    fields.forEach((field) => {
      const section = field.section || 'basic';
      if (!groups[section]) groups[section] = [];
      groups[section].push(field);
    });

    return Object.entries(groups).map(([section, sectionFields]) => {
      const isToggleable = section !== 'basic' && section !== 'settings';
      const isEnabled = !isToggleable || enabledSections.includes(section);
      const meta = SECTION_META[section];

      return (
        <div key={section} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          {isToggleable ? (
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-display text-base font-semibold">{meta?.label ?? sectionLabels[section]}</h3>
                <p className="text-xs text-muted-foreground font-body mt-0.5">{meta?.description}</p>
              </div>
              <Switch checked={isEnabled} onCheckedChange={() => toggleSection(section)} />
            </div>
          ) : (
            <div className="px-6 pt-6 pb-1">
              <h3 className="font-display text-lg font-semibold">{sectionLabels[section] || section}</h3>
            </div>
          )}
          {isEnabled && (
            <div className="p-6 space-y-5">
              {sectionFields.map((field) => (
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
          )}
        </div>
      );
    });
  };

  const renderVenueExtras = currentStep === 1 && (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-6 pt-6 pb-1">
          <h3 className="font-display text-base font-semibold">Video</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            Add a YouTube or Vimeo video to your invite.
          </p>
        </div>
        <div className="p-6">
          <input
            type="url"
            placeholder="https://youtu.be/... or https://vimeo.com/..."
            value={(formData.videoUrl as string | undefined) ?? ''}
            onChange={(event) => handleFieldChange('videoUrl', event.target.value || undefined)}
            className="w-full px-4 py-3 border border-border rounded-xl bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground font-body mt-1">
            Guests can watch it directly on the invitation page.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-6 pt-6 pb-1">
          <h3 className="font-display text-base font-semibold">Gifts &amp; Registry</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            Link gift registries or wish lists. Add up to 5 links.
          </p>
        </div>
        <div className="p-6 space-y-3">
          {((formData.registryLinks as Array<{ title: string; url: string }> | undefined) ?? []).map((link, index) => (
            <div key={index} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                placeholder="Label"
                value={link.title}
                onChange={(event) => {
                  const links = [...((formData.registryLinks as Array<{ title: string; url: string }>) ?? [])];
                  links[index] = { ...links[index], title: event.target.value };
                  handleFieldChange('registryLinks', links);
                }}
                className="flex-1 px-3 py-2.5 border border-border rounded-lg bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="url"
                placeholder="URL"
                value={link.url}
                onChange={(event) => {
                  const links = [...((formData.registryLinks as Array<{ title: string; url: string }>) ?? [])];
                  links[index] = { ...links[index], url: event.target.value };
                  handleFieldChange('registryLinks', links);
                }}
                className="flex-1 px-3 py-2.5 border border-border rounded-lg bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => {
                  const links = ((formData.registryLinks as Array<{ title: string; url: string }>) ?? []).filter((_, itemIndex) => itemIndex !== index);
                  handleFieldChange('registryLinks', links.length > 0 ? links : undefined);
                }}
                className="px-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          {((formData.registryLinks as Array<unknown> | undefined) ?? []).length < 5 && (
            <button
              type="button"
              onClick={() => {
                const links = [
                  ...((formData.registryLinks as Array<{ title: string; url: string }>) ?? []),
                  { title: '', url: '' },
                ];
                handleFieldChange('registryLinks', links);
              }}
              className="text-sm font-body text-primary hover:text-primary/80 transition-colors"
            >
              + Add Registry
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-6 pt-6 pb-1">
          <h3 className="font-display text-base font-semibold">Travel &amp; Accommodation</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            Suggest nearby hotels or accommodation. Add up to 5 options.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {((formData.accommodations as Array<{ name: string; address: string; link?: string; groupCode?: string; description?: string }> | undefined) ?? []).map((entry, index) => (
            <div key={index} className="space-y-2 p-4 rounded-lg border border-border bg-muted/20 relative">
              <button
                type="button"
                onClick={() => {
                  const list = ((formData.accommodations as Array<unknown>) ?? []).filter((_, itemIndex) => itemIndex !== index);
                  handleFieldChange('accommodations', list.length > 0 ? list : undefined);
                }}
                className="absolute top-3 right-3 text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove
              </button>
              <input
                type="text"
                placeholder="Hotel name *"
                value={entry.name}
                onChange={(event) => {
                  const list = [...((formData.accommodations as Array<typeof entry>) ?? [])];
                  list[index] = { ...list[index], name: event.target.value };
                  handleFieldChange('accommodations', list);
                }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="Address *"
                value={entry.address}
                onChange={(event) => {
                  const list = [...((formData.accommodations as Array<typeof entry>) ?? [])];
                  list[index] = { ...list[index], address: event.target.value };
                  handleFieldChange('accommodations', list);
                }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="url"
                  placeholder="Booking link"
                  value={entry.link ?? ''}
                  onChange={(event) => {
                    const list = [...((formData.accommodations as Array<typeof entry>) ?? [])];
                    list[index] = { ...list[index], link: event.target.value || undefined };
                    handleFieldChange('accommodations', list);
                  }}
                  className="px-3 py-2 border border-border rounded-lg bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  placeholder="Group code"
                  value={entry.groupCode ?? ''}
                  onChange={(event) => {
                    const list = [...((formData.accommodations as Array<typeof entry>) ?? [])];
                    list[index] = { ...list[index], groupCode: event.target.value || undefined };
                    handleFieldChange('accommodations', list);
                  }}
                  className="px-3 py-2 border border-border rounded-lg bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <input
                type="text"
                placeholder="Description"
                value={entry.description ?? ''}
                onChange={(event) => {
                  const list = [...((formData.accommodations as Array<typeof entry>) ?? [])];
                  list[index] = { ...list[index], description: event.target.value || undefined };
                  handleFieldChange('accommodations', list);
                }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
          {((formData.accommodations as Array<unknown> | undefined) ?? []).length < 5 && (
            <button
              type="button"
              onClick={() => {
                const list = [
                  ...((formData.accommodations as Array<{ name: string; address: string; link?: string; groupCode?: string; description?: string }>) ?? []),
                  { name: '', address: '' },
                ];
                handleFieldChange('accommodations', list);
              }}
              className="text-sm font-body text-primary hover:text-primary/80 transition-colors"
            >
              + Add Hotel / Accommodation
            </button>
          )}
        </div>
      </div>
    </>
  );

  const renderMediaExtras = currentStep === 2 && (
    <>
      {config.fields.some((field) => field.key === 'enableMusic') && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
            <div>
              <h3 className="font-display text-base font-semibold">Background Music</h3>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Play soft music when guests open your invite.
              </p>
            </div>
            <Switch checked={!!formData.enableMusic} onCheckedChange={(value) => handleFieldChange('enableMusic', value)} />
          </div>
          {formData.enableMusic && (
            <div className="p-6">
              <label className="block text-sm font-body font-medium mb-1.5">Select a track</label>
              <select
                value={(formData.musicUrl as string | undefined) ?? ''}
                onChange={(event) => handleFieldChange('musicUrl', event.target.value || undefined)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Choose a track...</option>
                {MUSIC_TRACKS.map((track) => (
                  <option key={track.url} value={track.url}>{track.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Music starts after the first tap. Guests can mute it anytime.
              </p>
            </div>
          )}
        </div>
      )}

      {enabledSections.includes('rsvp') && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-6 pt-6 pb-1">
            <h3 className="font-display text-base font-semibold">RSVP Options</h3>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Add meal choices or RSVP extras.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-body font-medium mb-1.5">Meal Options</label>
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Add a meal option"
                    value={mealOptionDraft}
                    onChange={(event) => setMealOptionDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addMealOption();
                      }
                    }}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={configuredMealOptions.length >= MAX_MEAL_OPTIONS}
                    onClick={addMealOption}
                  >
                    Add option
                  </Button>
                </div>

                {configuredMealOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground font-body">
                    No meal options added yet. Guests will not see a meal selector until you add one.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {configuredMealOptions.map((option) => (
                      <div key={option} className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-body">
                        <span>{option}</span>
                        <button
                          type="button"
                          className="text-muted-foreground transition hover:text-foreground"
                          onClick={() => removeMealOption(option)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Guests will see these as selectable options. Add up to {MAX_MEAL_OPTIONS} choices.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderPostEventCard = isPastEvent && (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
        <div>
          <h3 className="font-display text-base font-semibold">Post-Event Mode</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            Switch to a thank-you experience now that the event has passed.
          </p>
        </div>
        <Switch checked={!!formData.postEventMode} onCheckedChange={(value) => handleFieldChange('postEventMode', value)} />
      </div>
      {formData.postEventMode && (
        <div className="p-6">
          <label className="block text-sm font-body font-medium mb-1.5">Thank-you message</label>
          <textarea
            rows={3}
            placeholder="Thank you for celebrating with us!"
            value={(formData.thankYouMessage as string | undefined) ?? ''}
            onChange={(event) => handleFieldChange('thankYouMessage', event.target.value || undefined)}
            className="w-full px-4 py-3 border border-border rounded-xl bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className="text-xs text-muted-foreground font-body mt-1">
            This replaces the RSVP form on the live invite after the event.
          </p>
        </div>
      )}
    </div>
  );

  const reviewStep = (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-display text-xl font-semibold">Final review</h3>
            <p className="text-sm text-muted-foreground font-body mt-1">
              The live preview stays available on the side. Use this step to confirm readiness and publish with confidence.
            </p>
          </div>
        </div>
        <div className="grid gap-3 mt-5 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Required fields</p>
            <p className="mt-2 text-2xl font-semibold">{completedRequiredFields}/{requiredFields.length || 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Complete every required field before publishing.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Invite link</p>
            <p className="mt-2 text-sm font-medium break-all">{slug ? `/i/${slug}` : 'Not selected yet'}</p>
            <p className="mt-1 text-xs text-muted-foreground">Set the final guest-facing URL now if it is still empty.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Enabled sections</p>
            <p className="mt-2 text-2xl font-semibold">{enabledSections.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Only enabled sections will appear on the final invitation.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold">Publish checklist</h3>
          <div className="space-y-3 mt-4">
            {publishChecks.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3">
                {item.complete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold">What happens after publish</h3>
          <div className="space-y-3 mt-4">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-sm font-medium text-foreground">1. Guests open your custom link</p>
              <p className="text-xs text-muted-foreground mt-1">The live invite uses the same content you are previewing here.</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-sm font-medium text-foreground">2. RSVP and media sections appear automatically</p>
              <p className="text-xs text-muted-foreground mt-1">Only the sections you enabled remain visible to guests.</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-sm font-medium text-foreground">3. You can return to edit later</p>
              <p className="text-xs text-muted-foreground mt-1">Future updates will publish to the same shareable link.</p>
            </div>
          </div>
        </div>
      </div>

      {renderPostEventCard}
    </div>
  );

  const sidebarContent = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
            <h3 className="font-display text-lg font-semibold mt-2">{completionPercent}% ready to publish</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Keep editing while the preview updates automatically.
            </p>
          </div>
          <Badge variant={saveStatusVariant} className="shrink-0">{saveStatusLabel}</Badge>
        </div>
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPercent}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {completedRequiredFields} of {requiredFields.length || 0} required fields completed.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Live Preview</h3>
            <p className="text-sm text-muted-foreground">Switch between mobile and desktop anytime.</p>
          </div>
          <Eye className="h-5 w-5 text-muted-foreground mt-1" />
        </div>

        <div className="inline-flex rounded-xl border border-border bg-muted p-1 mb-4">
          <button
            type="button"
            onClick={() => setPreviewMode('mobile')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              previewMode === 'mobile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            Mobile
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('desktop')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              previewMode === 'desktop' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Laptop className="h-4 w-4" />
            Desktop
          </button>
        </div>

        {previewContent}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <Link2 className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-display text-lg font-semibold">Shareable Link</h3>
            <p className="text-sm text-muted-foreground">
              Choose the final guest URL early so you can review it while editing.
            </p>
          </div>
        </div>
        <SlugPicker value={slug} onChange={handleSlugChange} suggestion={slugSuggestion} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="font-display text-lg font-semibold">Readiness</h3>
        <div className="space-y-3 mt-4">
          {publishChecks.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              {item.complete ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <Clock3 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="border-b border-border bg-card/85 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Invite Builder</p>
              <h2 className="font-display text-2xl font-bold mt-1">{stepDefs[currentStep].label}</h2>
              <p className="text-sm text-muted-foreground mt-1">{stepDefs[currentStep].description}</p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {stepDefs.map((step, index) => (
                <div key={step.key} className="flex items-center gap-2">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    index < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStep
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/25 ring-offset-2 ring-offset-background'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStep ? 'OK' : index + 1}
                  </div>
                  <span className={`hidden text-sm sm:inline ${
                    index <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                  {index < stepDefs.length - 1 && <div className={`h-px w-8 ${index < currentStep ? 'bg-primary' : 'bg-border'}`} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current step</p>
                  <h3 className="font-display text-xl font-semibold mt-2">{stepDefs[currentStep].label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{stepDefs[currentStep].description}</p>
                </div>
                <Badge variant={saveStatusVariant}>{saveStatusLabel}</Badge>
              </div>
            </div>

            <div className="lg:hidden rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">Preview and Link</h3>
                  <p className="text-sm text-muted-foreground">Open the preview anytime and set the final guest URL early.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPreviewSheetOpen(true)}>
                  Preview
                </Button>
              </div>
              <SlugPicker value={slug} onChange={handleSlugChange} suggestion={slugSuggestion} />
            </div>

            {currentStep < stepDefs.length - 1 ? (
              <div className="space-y-6">
                {renderStepFields()}
                {renderVenueExtras}
                {renderMediaExtras}
              </div>
            ) : (
              reviewStep
            )}

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row">
                {currentStep > 0 && (
                  <Button variant="outline" onClick={handlePrev} className="flex-1 font-body">
                    Previous
                  </Button>
                )}
                <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="flex-1 font-body">
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                {currentStep < stepDefs.length - 1 ? (
                  <Button onClick={handleNext} className="flex-1 font-body">
                    Continue
                  </Button>
                ) : (
                  <Button onClick={handlePublish} disabled={publishing} className="flex-1 font-body">
                    {publishing ? 'Publishing...' : isEditing ? 'Update & Publish' : 'Publish Invite'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28">
              {sidebarContent}
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        <Button onClick={() => setPreviewSheetOpen(true)} className="rounded-full shadow-lg">
          Preview Invite
        </Button>
      </div>

      <Sheet open={previewSheetOpen} onOpenChange={setPreviewSheetOpen}>
        <SheetContent side="right" className="w-full max-w-[560px] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Preview and publishing tools</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {showPublishConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full shadow-xl animate-scale-in">
            <div className="text-center mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Final confirmation</p>
              <h3 className="font-display text-lg font-semibold mt-2">
                {isEditing ? 'Update and publish changes' : 'Publish invite'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {isEditing ? 'Your latest edits will go live immediately.' : 'Your invite will be published at the custom URL below.'}
              </p>
              {!isEditing && slug && (
                <p className="text-sm font-medium text-foreground mt-3 break-all">{window.location.host}/i/{slug}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 font-body" onClick={() => setShowPublishConfirm(false)}>
                Cancel
              </Button>
              <Button className="flex-1 font-body" onClick={confirmPublish} disabled={publishing}>
                {publishing ? 'Publishing...' : 'Confirm & Publish'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteForm;
