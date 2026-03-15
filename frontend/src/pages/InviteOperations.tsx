import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BellRing,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Globe2,
  Hotel,
  Languages,
  ListChecks,
  Loader2,
  Mail,
  Pencil,
  Plane,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { api } from "@/services/api";
import {
  BroadcastAudience,
  CollaboratorPermission,
  Invite,
  InviteBroadcast,
  InviteCollaborator,
  InviteGuest,
  InviteWorkspace,
  LocalizationSettings,
  RsvpSettings,
} from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { getInviteHeadline } from "@/utils/invite";
import { translateText } from "@/utils/translate";

const availableLanguages = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
];

const collaboratorPermissions: Array<{ key: CollaboratorPermission; label: string; description: string }> = [
  { key: "edit_content", label: "Edit content", description: "Change invite content, translations, and RSVP setup." },
  { key: "manage_rsvps", label: "Manage RSVPs", description: "Add guests, update responses, and manage travel or stay records." },
  { key: "send_reminders", label: "Send reminders", description: "Send segmented broadcasts and guest follow-ups." },
  { key: "view_reports", label: "View reports", description: "See response summaries, exports, and operations packs." },
  { key: "handle_guest_support", label: "Guest support", description: "Handle guest questions, parking, travel, and logistics." },
];

const broadcastTypes: Array<{ value: InviteBroadcast["type"]; label: string }> = [
  { value: "venue_change", label: "Venue change" },
  { value: "timing_update", label: "Timing update" },
  { value: "rsvp_reminder", label: "RSVP reminder" },
  { value: "dress_code_reminder", label: "Dress code reminder" },
  { value: "weather_advisory", label: "Weather advisory" },
  { value: "parking_update", label: "Parking update" },
  { value: "photos_uploaded", label: "Photos uploaded" },
  { value: "post_event_thank_you", label: "Post-event thank you" },
  { value: "custom", label: "Custom update" },
];

const responseOptions = ["yes", "no", "maybe", "pending"] as const;
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

const emptyGuest = (): Partial<InviteGuest> & { name: string } => ({
  name: "",
  email: "",
  phone: "",
  household: "",
  audienceSegment: "general",
  tags: [],
  language: "en",
  invitationStatus: "invited",
  response: undefined,
  guestCount: 1,
  adultCount: 0,
  childCount: 0,
  mealChoice: "",
  dietaryRestrictions: "",
  stayNeeded: false,
  lodgingStatus: "",
  hotelName: "",
  roomType: "",
  roomCount: 0,
  checkInDate: "",
  checkOutDate: "",
  shuttleRequired: false,
  transportMode: "",
  arrivalDetails: "",
  departureDetails: "",
  parkingRequired: false,
  supportNotes: "",
});

const emptyBroadcast = (): {
  type: InviteBroadcast["type"];
  title: string;
  subject: string;
  message: string;
  language: string;
  audience: BroadcastAudience;
} => ({
  type: "venue_change",
  title: "",
  subject: "",
  message: "",
  language: "en",
  audience: {
    segments: [],
    responses: [],
    languages: [],
    onlyMissingRsvp: false,
  },
});

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const formatDate = (value?: string) => {
  if (!value) return "Not set";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const emptySummary = {
  totals: {
    invited: 0,
    attending: 0,
    households: 0,
    adults: 0,
    children: 0,
    stayRequests: 0,
    transportRequests: 0,
  },
  mealCounts: {} as Record<string, number>,
  roomSummary: {} as Record<string, { rooms: number; guests: number }>,
  transportSummary: {} as Record<string, number>,
  followUpTasks: [] as string[],
  missingInfoAlerts: [] as string[],
};

const InviteOperations = () => {
  const { inviteId = "" } = useParams<{ inviteId: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [workspace, setWorkspace] = useState<InviteWorkspace | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingGuest, setSavingGuest] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [savingCollaborator, setSavingCollaborator] = useState(false);
  const [savingLanguageSetup, setSavingLanguageSetup] = useState(false);
  const [loadingExportPack, setLoadingExportPack] = useState(false);
  const [autoTranslatingLang, setAutoTranslatingLang] = useState<string | null>(null);
  const [autoTranslateProgress, setAutoTranslateProgress] = useState<{ done: number; total: number } | null>(null);
  const [translatingFieldKey, setTranslatingFieldKey] = useState<string | null>(null);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const [guestSearch, setGuestSearch] = useState("");
  const [mealOptionDraft, setMealOptionDraft] = useState("");
  const [guestForm, setGuestForm] = useState<Partial<InviteGuest> & { name: string }>(emptyGuest());
  const [broadcastForm, setBroadcastForm] = useState(emptyBroadcast());
  const [collaboratorForm, setCollaboratorForm] = useState<Pick<InviteCollaborator, "email" | "name" | "roleLabel" | "permissions">>({
    email: "",
    name: "",
    roleLabel: "Event planner",
    permissions: ["manage_rsvps", "view_reports"],
  });
  const [rsvpForm, setRsvpForm] = useState<RsvpSettings | null>(null);
  const [localizationForm, setLocalizationForm] = useState<LocalizationSettings | null>(null);
  const [exportPack, setExportPack] = useState<{ generatedAt: string; files: Array<{ filename: string; content: string }> } | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!inviteId) return;

    let mounted = true;

    api.getInvite(inviteId)
      .then(async (inviteResponse) => {
        if (!mounted) return;

        setInvite(inviteResponse);
        if (inviteResponse.canRenew || inviteResponse.canUpgradeEventManagement) {
          setWorkspace(null);
          return;
        }

        const workspaceResponse = await api.getInviteWorkspace(inviteId);
        if (!mounted) return;

        setWorkspace(workspaceResponse);
        setRsvpForm(workspaceResponse.rsvpSettings);
        setLocalizationForm(
          workspaceResponse.localization ?? {
            defaultLanguage: workspaceResponse.defaultLanguage,
            enabledLanguages: workspaceResponse.availableLanguages,
            translations: {},
            translationMeta: {},
          }
        );
        setBroadcastForm((current) => ({
          ...current,
          language: workspaceResponse.defaultLanguage,
        }));
      })
      .catch(() => {
        if (!mounted) return;
        toast({ title: "Could not load operations workspace", variant: "destructive" });
        navigate("/dashboard");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [authLoading, inviteId, isAuthenticated, navigate, toast]);

  const refreshWorkspace = async () => {
    const response = await api.getInviteWorkspace(inviteId);
    setWorkspace(response);
    setRsvpForm(response.rsvpSettings);
    setLocalizationForm(
      response.localization ?? {
        defaultLanguage: response.defaultLanguage,
        enabledLanguages: response.availableLanguages,
        translations: {},
        translationMeta: {},
      }
    );
  };

  const canUse = (permissions: CollaboratorPermission[]) =>
    workspace?.accessRole === "owner" || (workspace?.permissions.some((permission) => permissions.includes(permission)) ?? false);

  const canManageGuests = canUse(["manage_rsvps", "handle_guest_support", "edit_content"]);
  const canEditInviteSetup = canUse(["edit_content"]);
  const canSendBroadcasts = canUse(["send_reminders"]);
  const canManageCollaborators = workspace?.accessRole === "owner";
  const canViewReports = canUse(["view_reports"]);
  const availableGuestLanguages = localizationForm?.enabledLanguages ?? workspace?.availableLanguages ?? [];
  const defaultGuestLanguage = localizationForm?.defaultLanguage ?? workspace?.defaultLanguage ?? "en";
  const configuredMealOptions = useMemo(
    () => normalizeMealOptions(rsvpForm?.mealOptions ?? []),
    [rsvpForm?.mealOptions]
  );
  const availableMealOptions = useMemo(() => {
    const options = configuredMealOptions;
    if (guestForm.mealChoice && !options.includes(guestForm.mealChoice)) {
      return [...options, guestForm.mealChoice];
    }
    return options;
  }, [configuredMealOptions, guestForm.mealChoice]);

  const segments = useMemo(() => {
    const values = new Set(["general", "family", "vip", "vendors"]);
    workspace?.guests.forEach((guest) => {
      if (guest.audienceSegment?.trim()) values.add(guest.audienceSegment);
    });
    return Array.from(values);
  }, [workspace?.guests]);

  const filteredGuests = useMemo(() => {
    const query = guestSearch.trim().toLowerCase();
    const guests = workspace?.guests ?? [];
    return guests.filter((guest) => {
      if (!query) return true;
      return [guest.name, guest.email, guest.household, guest.audienceSegment, guest.supportNotes]
        .some((value) => String(value ?? "").toLowerCase().includes(query));
    });
  }, [guestSearch, workspace?.guests]);

  const translatableFields = useMemo(() => {
    if (!invite?.data) return [] as Array<{ key: string; label: string; value: string }>;

    return Object.entries(invite.data)
      .filter(([key, value]) => {
        if (typeof value !== "string" || !value.trim()) return false;
        const lowered = key.toLowerCase();
        return !["slug", "musicurl", "videourl", "locationurl"].includes(lowered) && !lowered.includes("image");
      })
      .slice(0, 20)
      .map(([key, value]) => ({
        key,
        label: key
          .replace(/([A-Z])/g, " $1")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase()),
        value,
      }));
  }, [invite?.data]);

  const estimatedBroadcastRecipients = useMemo(() => {
    const guests = workspace?.guests ?? [];
    return guests.filter((guest) => {
      if (!guest.email) return false;
      if (broadcastForm.audience.guestIds?.length && !broadcastForm.audience.guestIds.includes(guest.id)) return false;
      if (broadcastForm.audience.segments?.length && !broadcastForm.audience.segments.includes(guest.audienceSegment)) return false;
      if (broadcastForm.audience.languages?.length && !broadcastForm.audience.languages.includes(guest.language)) return false;
      if (broadcastForm.audience.onlyMissingRsvp && guest.response) return false;
      if (broadcastForm.audience.responses?.length) {
        const response = guest.response ?? "pending";
        if (!broadcastForm.audience.responses.includes(response)) return false;
      }
      return true;
    });
  }, [broadcastForm.audience, workspace?.guests]);

  const secondaryLanguages = useMemo(() => {
    if (!localizationForm) return [];
    return localizationForm.enabledLanguages.filter((language) => language !== localizationForm.defaultLanguage);
  }, [localizationForm]);

  const headline = invite ? getInviteHeadline(invite) : workspace?.invite.slug ?? "Operations";

  const pendingAccessRequests = useMemo(
    () => workspace?.accessRequests.filter((request) => request.status === "pending") ?? [],
    [workspace?.accessRequests]
  );

  const getRequestStatus = (permissions: CollaboratorPermission[]) =>
    workspace?.myAccessRequests.find((request) =>
      request.status === "pending" && permissions.every((permission) => request.requestedPermissions.includes(permission))
    );

  const copyText = async (value: string, title: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  const updateAudienceList = (key: "segments" | "responses" | "languages", value: string) => {
    setBroadcastForm((current) => {
      const existing = current.audience[key] ?? [];
      const next = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : [...existing, value];
      return {
        ...current,
        audience: {
          ...current.audience,
          [key]: next,
        },
      };
    });
  };

  const addMealOption = () => {
    const nextOption = mealOptionDraft.trim();
    if (!nextOption) {
      toast({ title: "Enter a meal option first", variant: "destructive" });
      return;
    }

    if (configuredMealOptions.length >= MAX_MEAL_OPTIONS) {
      toast({ title: `You can add up to ${MAX_MEAL_OPTIONS} meal options`, variant: "destructive" });
      return;
    }

    if (configuredMealOptions.some((option) => option.toLowerCase() === nextOption.toLowerCase())) {
      toast({ title: "That meal option already exists", variant: "destructive" });
      return;
    }

    setRsvpForm((current) => current ? {
      ...current,
      mealOptions: [...configuredMealOptions, nextOption],
    } : current);
    setMealOptionDraft("");
  };

  const removeMealOption = (optionToRemove: string) => {
    setRsvpForm((current) => current ? {
      ...current,
      mealOptions: current.mealOptions.filter((option) => option.trim().toLowerCase() !== optionToRemove.toLowerCase()),
    } : current);
  };

  const updateGuestForm = <K extends keyof InviteGuest | keyof ReturnType<typeof emptyGuest>,>(key: K, value: unknown) => {
    setGuestForm((current) => ({ ...current, [key]: value }));
  };

  const resetGuestForm = () => {
    setEditingGuestId(null);
    setGuestForm(emptyGuest());
  };

  const startGuestEdit = (guest: InviteGuest) => {
    setEditingGuestId(guest.id);
    setGuestForm({
      ...guest,
      email: guest.email ?? "",
      phone: guest.phone ?? "",
      household: guest.household ?? "",
      mealChoice: guest.mealChoice ?? "",
      dietaryRestrictions: guest.dietaryRestrictions ?? "",
      lodgingStatus: guest.lodgingStatus ?? "",
      hotelName: guest.hotelName ?? "",
      roomType: guest.roomType ?? "",
      checkInDate: guest.checkInDate?.slice(0, 10) ?? "",
      checkOutDate: guest.checkOutDate?.slice(0, 10) ?? "",
      transportMode: guest.transportMode ?? "",
      arrivalDetails: guest.arrivalDetails ?? "",
      departureDetails: guest.departureDetails ?? "",
      supportNotes: guest.supportNotes ?? "",
    });
  };

  const saveGuest = async () => {
    if (!guestForm.name.trim()) {
      toast({ title: "Guest name is required", variant: "destructive" });
      return;
    }

    setSavingGuest(true);
    try {
      const payload = {
        ...guestForm,
        name: guestForm.name.trim(),
        email: guestForm.email?.trim() || undefined,
        phone: guestForm.phone?.trim() || undefined,
        household: guestForm.household?.trim() || undefined,
        audienceSegment: guestForm.audienceSegment?.trim() || "general",
        tags: (guestForm.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
        language: guestForm.language || defaultGuestLanguage,
        guestCount: Number(guestForm.guestCount ?? 1) || 1,
        adultCount: Number(guestForm.adultCount ?? 0) || 0,
        childCount: Number(guestForm.childCount ?? 0) || 0,
        mealChoice: guestForm.mealChoice?.trim() || undefined,
        roomCount: Number(guestForm.roomCount ?? 0) || 0,
      };

      if (editingGuestId) {
        await api.updateInviteGuest(inviteId, editingGuestId, payload);
      } else {
        await api.createInviteGuest(inviteId, payload);
      }

      await refreshWorkspace();
      resetGuestForm();
      toast({ title: editingGuestId ? "Guest updated" : "Guest added" });
    } catch {
      toast({ title: "Could not save guest", variant: "destructive" });
    } finally {
      setSavingGuest(false);
    }
  };

  const removeGuest = async (guestId: string) => {
    if (removingId) return;
    setRemovingId(guestId);
    try {
      await api.deleteInviteGuest(inviteId, guestId);
      await refreshWorkspace();
      if (editingGuestId === guestId) resetGuestForm();
      toast({ title: "Guest removed" });
    } catch {
      toast({ title: "Could not remove guest", variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const saveRsvpSetup = async () => {
    if (!rsvpForm) return;

    const mealOptions = normalizeMealOptions(rsvpForm.mealOptions);
    if (rsvpForm.collectMealChoice && mealOptions.length === 0) {
      toast({ title: "Add at least one meal option to collect meal choices", variant: "destructive" });
      return;
    }

    setSavingConfig(true);
    try {
      await api.updateInviteRsvpSettings(inviteId, {
        ...rsvpForm,
        maxGuestCount: rsvpForm.maxGuestCount ? Math.max(1, Math.min(9999, Number(rsvpForm.maxGuestCount) || 1)) : undefined,
        mealOptions,
        customQuestions: rsvpForm.customQuestions.slice(0, 6),
      });
      await refreshWorkspace();
      toast({ title: "RSVP setup updated" });
    } catch {
      toast({ title: "Could not update RSVP setup", variant: "destructive" });
    } finally {
      setSavingConfig(false);
    }
  };

  const saveLanguages = async () => {
    if (!localizationForm) return;

    setSavingLanguageSetup(true);
    try {
      await api.updateInviteLocalization(inviteId, localizationForm);
      await refreshWorkspace();
      toast({ title: "Language setup updated" });
    } catch {
      toast({ title: "Could not save language setup", variant: "destructive" });
    } finally {
      setSavingLanguageSetup(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      toast({ title: "Add a title and message", variant: "destructive" });
      return;
    }

    if (estimatedBroadcastRecipients.length === 0) {
      toast({ title: "No recipients match the selected filters", variant: "destructive" });
      return;
    }

    setSendingBroadcast(true);
    try {
      await api.createInviteBroadcast(inviteId, {
        ...broadcastForm,
        title: broadcastForm.title.trim(),
        subject: broadcastForm.subject.trim() || undefined,
        message: broadcastForm.message.trim(),
      });
      await refreshWorkspace();
      setBroadcastForm({
        ...emptyBroadcast(),
        language: localizationForm?.defaultLanguage || "en",
      });
      toast({ title: "Broadcast sent" });
    } catch {
      toast({ title: "Could not send broadcast", variant: "destructive" });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const inviteCollaborator = async () => {
    if (!collaboratorForm.email.trim() || !collaboratorForm.roleLabel.trim() || collaboratorForm.permissions.length === 0) {
      toast({ title: "Complete the collaborator form", variant: "destructive" });
      return;
    }

    setSavingCollaborator(true);
    try {
      await api.inviteCollaborator(inviteId, {
        email: collaboratorForm.email.trim(),
        name: collaboratorForm.name?.trim() || undefined,
        roleLabel: collaboratorForm.roleLabel.trim(),
        permissions: collaboratorForm.permissions,
      });
      await refreshWorkspace();
      setCollaboratorForm({
        email: "",
        name: "",
        roleLabel: "Event planner",
        permissions: ["manage_rsvps", "view_reports"],
      });
      toast({ title: "Collaborator invited" });
    } catch {
      toast({ title: "Could not invite collaborator", variant: "destructive" });
    } finally {
      setSavingCollaborator(false);
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    if (removingId) return;
    setRemovingId(collaboratorId);
    try {
      await api.removeCollaborator(inviteId, collaboratorId);
      await refreshWorkspace();
      toast({ title: "Collaborator removed" });
    } catch {
      toast({ title: "Could not remove collaborator", variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const requestAccess = async (permissions: CollaboratorPermission[]) => {
    const allowedPermissions = permissions.filter((permission) => workspace?.requestablePermissions.includes(permission));
    if (allowedPermissions.length === 0) {
      toast({ title: "No additional permissions are available to request", variant: "destructive" });
      return;
    }

    try {
      await api.requestInviteAccess(inviteId, allowedPermissions);
      await refreshWorkspace();
      toast({ title: "Access request sent" });
    } catch {
      toast({ title: "Could not submit access request", variant: "destructive" });
    }
  };

  const approveAccessRequest = async (accessRequestId: string) => {
    if (resolvingRequestId) return;
    setResolvingRequestId(accessRequestId);
    try {
      await api.approveInviteAccessRequest(inviteId, accessRequestId);
      await refreshWorkspace();
      toast({ title: "Access request approved" });
    } catch {
      toast({ title: "Could not approve access request", variant: "destructive" });
    } finally {
      setResolvingRequestId(null);
    }
  };

  const rejectAccessRequest = async (accessRequestId: string) => {
    if (resolvingRequestId) return;
    setResolvingRequestId(accessRequestId);
    try {
      await api.rejectInviteAccessRequest(inviteId, accessRequestId);
      await refreshWorkspace();
      toast({ title: "Access request rejected" });
    } catch {
      toast({ title: "Could not reject access request", variant: "destructive" });
    } finally {
      setResolvingRequestId(null);
    }
  };

  const renderLockedState = (
    title: string,
    description: string,
    requestedPermissions: CollaboratorPermission[]
  ) => {
    const pendingRequest = getRequestStatus(requestedPermissions);

    return (
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {requestedPermissions.map((permission) => (
            <Badge key={permission} variant="outline">{permission.replace(/_/g, " ")}</Badge>
          ))}
        </div>
        {pendingRequest ? (
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Access request pending since {formatDate(pendingRequest.requestedAt)}.
          </div>
        ) : (
          <Button
            disabled={!workspace?.requestablePermissions.some((permission) => requestedPermissions.includes(permission))}
            onClick={() => requestAccess(requestedPermissions)}
          >
            Request access from Admin
          </Button>
        )}
      </div>
    );
  };

  const loadExportPack = async () => {
    setLoadingExportPack(true);
    try {
      const response = await api.getInviteExportPack(inviteId);
      setExportPack(response);
      toast({ title: "Operations pack ready" });
    } catch {
      toast({ title: "Could not generate operations pack", variant: "destructive" });
    } finally {
      setLoadingExportPack(false);
    }
  };

  const toggleLanguage = (language: string) => {
    setLocalizationForm((current) => {
      if (!current) return current;
      const exists = current.enabledLanguages.includes(language);
      const nextEnabled = exists
        ? current.enabledLanguages.filter((item) => item !== language)
        : [...current.enabledLanguages, language];
      const enabledLanguages = nextEnabled.length > 0 ? nextEnabled : [current.defaultLanguage];
      const defaultLanguage = enabledLanguages.includes(current.defaultLanguage)
        ? current.defaultLanguage
        : enabledLanguages[0];

      return {
        ...current,
        defaultLanguage,
        enabledLanguages: Array.from(new Set(enabledLanguages)),
      };
    });
  };

  const setTranslationValue = (language: string, key: string, value: string) => {
    setLocalizationForm((current) => {
      if (!current) return current;
      return {
        ...current,
        translations: {
          ...current.translations,
          [language]: {
            ...(current.translations[language] ?? {}),
            [key]: value,
          },
        },
      };
    });
  };

  const translateOneField = async (language: string, fieldKey: string, fieldValue: string) => {
    const sourceLang = localizationForm?.defaultLanguage ?? "en";
    setTranslatingFieldKey(`${language}:${fieldKey}`);
    try {
      const translated = await translateText(fieldValue, sourceLang, language);
      setTranslationValue(language, fieldKey, translated);
    } finally {
      setTranslatingFieldKey(null);
    }
  };

  const autoTranslateLanguage = async (language: string) => {
    if (!localizationForm || autoTranslatingLang) return;
    const sourceLang = localizationForm.defaultLanguage ?? "en";
    // Only translate fields with meaningful content (more than 3 words)
    const fieldsToTranslate = translatableFields.filter(
      (field) => field.value.split(/\s+/).length > 3
    );
    if (fieldsToTranslate.length === 0) {
      toast({ title: "No fields with enough content to auto-translate", variant: "destructive" });
      return;
    }
    setAutoTranslatingLang(language);
    setAutoTranslateProgress({ done: 0, total: fieldsToTranslate.length });
    for (let i = 0; i < fieldsToTranslate.length; i++) {
      const field = fieldsToTranslate[i];
      const translated = await translateText(field.value, sourceLang, language);
      setTranslationValue(language, field.key, translated);
      setAutoTranslateProgress({ done: i + 1, total: fieldsToTranslate.length });
    }
    setAutoTranslatingLang(null);
    setAutoTranslateProgress(null);
    toast({ title: `${fieldsToTranslate.length} fields auto-translated to ${availableLanguages.find((l) => l.code === language)?.label ?? language}` });
  };

  const setQuestionTranslation = (questionIndex: number, language: string, value: string) => {
    setRsvpForm((current) => {
      if (!current) return current;
      return {
        ...current,
        customQuestions: current.customQuestions.map((question, index) =>
          index === questionIndex
            ? {
                ...question,
                translations: {
                  ...(question.translations ?? {}),
                  [language]: value,
                },
              }
            : question
        ),
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-[680px] rounded-2xl" />
      </div>
    );
  }

  if (invite?.canRenew) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-xl rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <h1 className="font-display text-3xl font-semibold">Renew this invite first</h1>
          <p className="text-sm text-muted-foreground">
            Event management is locked because this invite has passed its 3 month validity window.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(`/checkout/${invite.templateSlug}?intent=renewal&inviteId=${invite.id}`)}>
              Renew invite
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (invite?.canUpgradeEventManagement) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-xl rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <h1 className="font-display text-3xl font-semibold">Unlock event tools</h1>
          <p className="text-sm text-muted-foreground">
            This Package B invite is live, but guest management, RSVP tools, reminders, localization, and exports are still locked.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(`/checkout/${invite.templateSlug}?intent=event_management_addon&inviteId=${invite.id}`)}>
              Unlock event management
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/dashboard/invites/${invite.id}/edit`}>Edit invite</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace || !rsvpForm || !localizationForm) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-[680px] rounded-2xl" />
      </div>
    );
  }

  const summary = workspace.summary ?? emptySummary;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between gap-4 px-4">
          <div className="min-w-0">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-[180px] truncate">{headline}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex capitalize shrink-0">
            {workspace.accessRole}
          </Badge>
        </div>
      </nav>

      <div className="container space-y-6 px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Invited</p>
            <p className="mt-2 text-3xl font-display font-bold">{summary.totals.invited}</p>
            <p className="mt-2 text-xs text-muted-foreground">Total guest records in this workspace.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Attending</p>
            <p className="mt-2 text-3xl font-display font-bold">{summary.totals.attending}</p>
            <p className="mt-2 text-xs text-muted-foreground">Combined confirmed headcount.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Households</p>
            <p className="mt-2 text-3xl font-display font-bold">{summary.totals.households}</p>
            <p className="mt-2 text-xs text-muted-foreground">Useful for rooming and check-in planning.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Stay Requests</p>
            <p className="mt-2 text-3xl font-display font-bold">{summary.totals.stayRequests}</p>
            <p className="mt-2 text-xs text-muted-foreground">Guests currently needing accommodation.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Updates Sent</p>
            <p className="mt-2 text-3xl font-display font-bold">{workspace.broadcasts.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">Updates and reminders sent to guests.</p>
          </div>
        </div>

        {/* Quick-action strip */}
        <div className="flex flex-wrap gap-3">
          {(canManageGuests || canViewReports || canEditInviteSetup) && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/dashboard/invites/${inviteId}/rsvps`}>
                <ListChecks className="w-4 h-4 mr-2" />
                View Responses
              </Link>
            </Button>
          )}
          {canEditInviteSetup && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/dashboard/invites/${inviteId}/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Invite Content
              </Link>
            </Button>
          )}
          {workspace.invite.slug && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/i/${workspace.invite.slug}`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Live Invite
              </Link>
            </Button>
          )}
        </div>

        <Tabs defaultValue="guests" className="space-y-4">
          <TabsList className="h-auto flex-wrap gap-2 bg-transparent p-0">
            <TabsTrigger value="guests">Guest List</TabsTrigger>
            <TabsTrigger value="broadcasts">Send Updates</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="workspace">Team Access</TabsTrigger>
            <TabsTrigger value="ops">Export & Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-6">
            {/* Orientation banner */}
            <div className="rounded-xl bg-muted/30 border border-border px-5 py-4 flex items-start gap-3">
              <Users className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground font-body">
                Configure what your guests see when they RSVP, then manage your guest list below. Add guests ahead of time to track attendance and logistics per person.
              </p>
            </div>

            <section>
              <h2 className="font-display text-xl font-semibold mb-4">RSVP Form Setup</h2>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-semibold">Custom RSVP setup</h3>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Decide what guests can answer after purchase, keep the form practical, and avoid collecting information your team will not use.
                  </p>
                </div>
                <Button disabled={!canEditInviteSetup || savingConfig} onClick={saveRsvpSetup}>
                  {savingConfig ? "Saving..." : "Save RSVP Setup"}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { key: "collectEmail", label: "Collect guest email" },
                  { key: "collectPhone", label: "Collect phone number" },
                  { key: "collectHousehold", label: "Ask household or family name" },
                  { key: "collectAdultsChildrenSplit", label: "Split adults and children" },
                  { key: "collectMealChoice", label: "Collect meal choice" },
                  { key: "collectDietaryRestrictions", label: "Collect dietary notes" },
                  { key: "collectTravelPlans", label: "Collect transport plans" },
                  { key: "collectStayNeeds", label: "Collect stay requirements" },
                  { key: "allowPlusOnes", label: "Allow extra guests" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <Switch
                      checked={Boolean(rsvpForm[item.key as keyof RsvpSettings])}
                      disabled={!canEditInviteSetup}
                      onCheckedChange={(checked) =>
                        setRsvpForm((current) => current ? { ...current, [item.key]: checked } : current)
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Optional max guest count</Label>
                  <Input
                    type="number"
                    min={1}
                    max={9999}
                    disabled={!canEditInviteSetup}
                    placeholder="Leave blank for unlimited"
                    value={rsvpForm.maxGuestCount ?? ""}
                    onChange={(event) =>
                      setRsvpForm((current) => current ? {
                        ...current,
                        maxGuestCount: event.target.value ? Number(event.target.value) || undefined : undefined,
                      } : current)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>RSVP deadline</Label>
                  <Input
                    type="date"
                    disabled={!canEditInviteSetup}
                    value={rsvpForm.deadline?.slice(0, 10) ?? ""}
                    onChange={(event) =>
                      setRsvpForm((current) => current ? { ...current, deadline: event.target.value || undefined } : current)
                    }
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Meal options</Label>
                    <span className="text-xs text-muted-foreground">{configuredMealOptions.length}/{MAX_MEAL_OPTIONS}</span>
                  </div>
                  <div className="flex flex-col gap-2 lg:flex-row">
                    <Input
                      disabled={!canEditInviteSetup || configuredMealOptions.length >= MAX_MEAL_OPTIONS}
                      placeholder="Add a meal option"
                      value={mealOptionDraft}
                      onChange={(event) => setMealOptionDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addMealOption();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canEditInviteSetup || configuredMealOptions.length >= MAX_MEAL_OPTIONS}
                      onClick={addMealOption}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                  {configuredMealOptions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No meal options added yet. Guests will only see a meal picker after you add at least one option.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {configuredMealOptions.map((option) => (
                        <div key={option} className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm">
                          <span>{option}</span>
                          <button
                            type="button"
                            className="text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={!canEditInviteSetup}
                            onClick={() => removeMealOption(option)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Guests will see these as selectable options instead of a text field.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Host questions</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Keep this short and operationally useful. Six questions maximum.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canEditInviteSetup}
                    onClick={() =>
                      setRsvpForm((current) => current ? {
                        ...current,
                        customQuestions: [
                          ...current.customQuestions,
                          {
                            id: `question_${current.customQuestions.length + 1}`,
                            label: "New host question",
                            type: "text",
                            required: false,
                          },
                        ].slice(0, 6),
                      } : current)
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Question
                  </Button>
                </div>

                {rsvpForm.customQuestions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                    No custom host questions yet. Add only what is genuinely needed for planning.
                  </div>
                ) : (
                  rsvpForm.customQuestions.map((question, index) => (
                    <div key={question.id} className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-[1.6fr_1fr_auto_auto]">
                      <Input
                        disabled={!canEditInviteSetup}
                        value={question.label}
                        onChange={(event) =>
                          setRsvpForm((current) => current ? {
                            ...current,
                            customQuestions: current.customQuestions.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, label: event.target.value } : entry
                            ),
                          } : current)
                        }
                      />
                      <select
                        disabled={!canEditInviteSetup}
                        value={question.type}
                        onChange={(event) =>
                          setRsvpForm((current) => current ? {
                            ...current,
                            customQuestions: current.customQuestions.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, type: event.target.value as typeof question.type }
                                : entry
                            ),
                          } : current)
                        }
                        className="rounded-md border border-border bg-background px-3 py-2"
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="select">Select</option>
                        <option value="boolean">Yes / No</option>
                        <option value="number">Number</option>
                      </select>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          disabled={!canEditInviteSetup}
                          checked={question.required}
                          onChange={(event) =>
                            setRsvpForm((current) => current ? {
                              ...current,
                              customQuestions: current.customQuestions.map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, required: event.target.checked } : entry
                              ),
                            } : current)
                          }
                        />
                        Required
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canEditInviteSetup}
                        onClick={() =>
                          setRsvpForm((current) => current ? {
                            ...current,
                            customQuestions: current.customQuestions.filter((_, entryIndex) => entryIndex !== index),
                          } : current)
                        }
                      >
                        Remove
                      </Button>
                      {question.type === "select" && (
                        <div className="md:col-span-4">
                          <Input
                            disabled={!canEditInviteSetup}
                            placeholder="Option 1, Option 2, Option 3"
                            value={(question.options ?? []).join(", ")}
                            onChange={(event) =>
                              setRsvpForm((current) => current ? {
                                ...current,
                                customQuestions: current.customQuestions.map((entry, entryIndex) =>
                                  entryIndex === index
                                    ? {
                                        ...entry,
                                        options: event.target.value
                                          .split(",")
                                          .map((item) => item.trim())
                                          .filter(Boolean),
                                      }
                                    : entry
                                ),
                              } : current)
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            </section>

            <Separator />

            <section>
              <h2 className="font-display text-xl font-semibold mb-4">Guest List</h2>
            {canManageGuests ? (
              <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl font-semibold">
                      {editingGuestId ? "Edit guest" : "Add guest"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Keep each guest record close to real planning needs: household, travel, stay, and support notes.
                    </p>
                  </div>
                  {editingGuestId && (
                    <Button variant="outline" size="sm" onClick={resetGuestForm}>
                      Cancel
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <Label>Guest name</Label>
                    <Input value={guestForm.name} onChange={(event) => updateGuestForm("name", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={guestForm.email ?? ""} onChange={(event) => updateGuestForm("email", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={guestForm.phone ?? ""} onChange={(event) => updateGuestForm("phone", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Household</Label>
                    <Input value={guestForm.household ?? ""} onChange={(event) => updateGuestForm("household", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Guest group</Label>
                    <Input value={guestForm.audienceSegment ?? "general"} onChange={(event) => updateGuestForm("audienceSegment", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <select
                      value={guestForm.language ?? defaultGuestLanguage}
                      onChange={(event) => updateGuestForm("language", event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2"
                    >
                      {availableGuestLanguages.map((language) => (
                        <option key={language} value={language}>
                          {availableLanguages.find((item) => item.code === language)?.label ?? language}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Outreach status</Label>
                    <select
                      value={guestForm.invitationStatus ?? "invited"}
                      onChange={(event) => updateGuestForm("invitationStatus", event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2"
                    >
                      <option value="invited">Invited</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="waitlisted">Waitlisted</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Their response</Label>
                    <select
                      value={guestForm.response ?? ""}
                      onChange={(event) => updateGuestForm("response", event.target.value || undefined)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2"
                    >
                      <option value="">Pending</option>
                      <option value="yes">Attending</option>
                      <option value="no">Not attending</option>
                      <option value="maybe">Maybe</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Total in party</Label>
                    <Input
                      type="number"
                      min={1}
                      max={9999}
                      value={guestForm.guestCount ?? 1}
                      onChange={(event) => updateGuestForm("guestCount", Number(event.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Adults</Label>
                    <Input
                      type="number"
                      min={0}
                      max={9999}
                      value={guestForm.adultCount ?? 0}
                      onChange={(event) => updateGuestForm("adultCount", Number(event.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Children</Label>
                    <Input
                      type="number"
                      min={0}
                      max={9999}
                      value={guestForm.childCount ?? 0}
                      onChange={(event) => updateGuestForm("childCount", Number(event.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meal choice</Label>
                    <select
                      value={guestForm.mealChoice ?? ""}
                      onChange={(event) => updateGuestForm("mealChoice", event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2"
                    >
                      <option value="">Select a meal option</option>
                      {availableMealOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dietary notes</Label>
                    <Input value={guestForm.dietaryRestrictions ?? ""} onChange={(event) => updateGuestForm("dietaryRestrictions", event.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-1">
                    <Label>Tags</Label>
                    <Input
                      placeholder="Family, Sangeet, Shuttle A"
                      value={(guestForm.tags ?? []).join(", ")}
                      onChange={(event) =>
                        updateGuestForm("tags", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))
                      }
                    />
                  </div>
                </div>

                <Collapsible
                  className="rounded-xl border border-border p-4 space-y-4"
                  defaultOpen={Boolean(guestForm.stayNeeded || guestForm.shuttleRequired)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-2 text-left group">
                        <div>
                          <p className="font-medium">Travel and stay</p>
                          <p className="text-xs text-muted-foreground">
                            Track hotel assignments, transport need, and support notes for each guest.
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180 ml-2" />
                      </button>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-4 shrink-0">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(guestForm.stayNeeded)}
                          onChange={(event) => updateGuestForm("stayNeeded", event.target.checked)}
                        />
                        Stay needed
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(guestForm.shuttleRequired)}
                          onChange={(event) => updateGuestForm("shuttleRequired", event.target.checked)}
                        />
                        Transport needed
                      </label>
                    </div>
                  </div>

                  <CollapsibleContent>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-2">
                      <Label>Hotel name</Label>
                      <Input value={guestForm.hotelName ?? ""} onChange={(event) => updateGuestForm("hotelName", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Room type</Label>
                      <Input value={guestForm.roomType ?? ""} onChange={(event) => updateGuestForm("roomType", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Rooms required</Label>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={guestForm.roomCount ?? 0}
                        onChange={(event) => updateGuestForm("roomCount", Number(event.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Transport mode</Label>
                      <Input
                        placeholder="Airport pickup, shuttle, own car"
                        value={guestForm.transportMode ?? ""}
                        onChange={(event) => updateGuestForm("transportMode", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Check-in date</Label>
                      <Input type="date" value={guestForm.checkInDate ?? ""} onChange={(event) => updateGuestForm("checkInDate", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Check-out date</Label>
                      <Input type="date" value={guestForm.checkOutDate ?? ""} onChange={(event) => updateGuestForm("checkOutDate", event.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2 xl:col-span-1">
                      <Label>Arrival details</Label>
                      <Textarea value={guestForm.arrivalDetails ?? ""} onChange={(event) => updateGuestForm("arrivalDetails", event.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2 xl:col-span-1">
                      <Label>Departure details</Label>
                      <Textarea value={guestForm.departureDetails ?? ""} onChange={(event) => updateGuestForm("departureDetails", event.target.value)} />
                    </div>
                    <div className="md:col-span-2 xl:col-span-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(guestForm.parkingRequired)}
                          onChange={(event) => updateGuestForm("parkingRequired", event.target.checked)}
                        />
                        Parking support needed
                      </label>
                    </div>
                    <div className="space-y-2 md:col-span-2 xl:col-span-1">
                      <Label>Support notes</Label>
                      <Textarea
                        placeholder="VIP handling, arrival concerns, family coordination, mobility needs"
                        value={guestForm.supportNotes ?? ""}
                        onChange={(event) => updateGuestForm("supportNotes", event.target.value)}
                      />
                    </div>
                  </div>
                  </CollapsibleContent>
                </Collapsible>

                <Button disabled={!canManageGuests || savingGuest} onClick={saveGuest}>
                  {savingGuest ? "Saving..." : editingGuestId ? "Save Guest Changes" : "Add Guest"}
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-semibold">Guest list</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Copy unique links with preselected language, edit household logistics, and spot missing guest details fast.
                    </p>
                  </div>
                  <div className="w-full max-w-xs">
                    <Input
                      value={guestSearch}
                      onChange={(event) => setGuestSearch(event.target.value)}
                      placeholder="Search guests, segment, household"
                    />
                  </div>
                </div>

                {filteredGuests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    No guests match the current search.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredGuests.map((guest) => (
                      <div key={guest.id} className="rounded-xl border border-border p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-xl font-semibold">{guest.name}</h3>
                              <Badge variant="secondary">{guest.audienceSegment}</Badge>
                              <Badge variant="outline">{guest.language.toUpperCase()}</Badge>
                              <Badge variant={guest.response === "yes" ? "default" : guest.response === "no" ? "destructive" : "outline"}>
                                {guest.response ?? "pending"}
                              </Badge>
                            </div>

                            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                              <p>{guest.email || "No email yet"}</p>
                              <p>{guest.phone || "No phone yet"}</p>
                              <p>{guest.household || "No household set"}</p>
                              <p>{guest.guestCount} guest(s) linked</p>
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                                  <Hotel className="h-4 w-4" />
                                  Stay
                                </div>
                                <p className="text-muted-foreground">
                                  {guest.stayNeeded
                                    ? `${guest.hotelName || "Hotel pending"} - ${guest.roomType || "Room type pending"} - ${guest.roomCount} room(s)`
                                    : "No stay currently required"}
                                </p>
                                {(guest.checkInDate || guest.checkOutDate) && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {formatDate(guest.checkInDate)} to {formatDate(guest.checkOutDate)}
                                  </p>
                                )}
                              </div>

                              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                                  <Plane className="h-4 w-4" />
                                  Travel
                                </div>
                                <p className="text-muted-foreground">
                                  {guest.shuttleRequired || guest.transportMode
                                    ? `${guest.transportMode || "Transport pending"}${guest.parkingRequired ? " - Parking needed" : ""}`
                                    : "No transport support currently required"}
                                </p>
                                {guest.arrivalDetails && <p className="mt-1 text-xs text-muted-foreground">Arrival: {guest.arrivalDetails}</p>}
                              </div>
                            </div>

                            {guest.supportNotes && (
                              <p className="rounded-lg bg-secondary/60 p-3 text-sm text-secondary-foreground">
                                {guest.supportNotes}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {guest.email && (
                              <Button variant="outline" size="sm" onClick={() => copyText(guest.email!, "Guest email copied")}>
                                <Mail className="mr-1 h-4 w-4" />
                                Email
                              </Button>
                            )}
                            {guest.guestLink && (
                              <Button variant="outline" size="sm" onClick={() => copyText(guest.guestLink!, "Guest link copied")}>
                                <Copy className="mr-1 h-4 w-4" />
                                Copy Link
                              </Button>
                            )}
                            <Button variant="outline" size="sm" disabled={!canManageGuests} onClick={() => startGuestEdit(guest)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" disabled={!canManageGuests || removingId === guest.id} onClick={() => removeGuest(guest.id)}>
                              <Trash2 className="mr-1 h-4 w-4" />
                              {removingId === guest.id ? "Removing..." : "Remove"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            ) : (
              renderLockedState(
                "Guest list access",
                "Only collaborators with RSVP or guest support access can view and update guest records.",
                ["manage_rsvps"]
              )
            )}
            </section>
          </TabsContent>

          <TabsContent value="broadcasts" className="space-y-6">
            {/* Orientation banner */}
            <div className="rounded-xl bg-muted/30 border border-border px-5 py-4 flex items-start gap-3">
              <BellRing className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground font-body">
                Send targeted updates to your guests by group, response, or language. A full history of every update you've sent is shown on the right.
              </p>
            </div>
            {!canSendBroadcasts ? renderLockedState(
              "Guest updates",
              "Only collaborators with reminder access can send operational broadcasts and review broadcast history.",
              ["send_reminders"]
            ) : (
            <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <BellRing className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-display text-2xl font-semibold">Compose an update</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Send operational updates only to the guests who need them and keep a trackable history of who received each message.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Update type</Label>
                  <select
                    value={broadcastForm.type}
                    onChange={(event) => setBroadcastForm((current) => ({ ...current, type: event.target.value as InviteBroadcast["type"] }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  >
                    {broadcastTypes.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={broadcastForm.title} onChange={(event) => setBroadcastForm((current) => ({ ...current, title: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Email subject</Label>
                  <Input value={broadcastForm.subject} onChange={(event) => setBroadcastForm((current) => ({ ...current, subject: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <select
                    value={broadcastForm.language}
                    onChange={(event) => setBroadcastForm((current) => ({ ...current, language: event.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  >
                    {availableGuestLanguages.map((language) => (
                      <option key={language} value={language}>
                        {availableLanguages.find((item) => item.code === language)?.label ?? language}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    rows={7}
                    placeholder="Example: The ceremony now starts at 5:30 PM. Please follow the updated valet entrance sign when you arrive."
                    value={broadcastForm.message}
                    onChange={(event) => setBroadcastForm((current) => ({ ...current, message: event.target.value }))}
                  />
                </div>

                <div className="rounded-xl border border-border p-4 space-y-4">
                  <div>
                    <p className="font-medium text-foreground">Audience filters</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Segment by guest type, language, response state, or people who still have not replied.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Segments</Label>
                    <div className="flex flex-wrap gap-2">
                      {segments.map((segment) => {
                        const active = broadcastForm.audience.segments?.includes(segment) ?? false;
                        return (
                          <button
                            key={segment}
                            type="button"
                            onClick={() => updateAudienceList("segments", segment)}
                            className={`rounded-full border px-3 py-1.5 text-xs ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}
                          >
                            {segment}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Responses</Label>
                    <div className="flex flex-wrap gap-2">
                      {responseOptions.map((response) => {
                        const active = broadcastForm.audience.responses?.includes(response) ?? false;
                        return (
                          <button
                            key={response}
                            type="button"
                            onClick={() => updateAudienceList("responses", response)}
                            className={`rounded-full border px-3 py-1.5 text-xs ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}
                          >
                            {response}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Languages</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableGuestLanguages.map((language) => {
                        const active = broadcastForm.audience.languages?.includes(language) ?? false;
                        const label = availableLanguages.find((item) => item.code === language)?.label ?? language;
                        return (
                          <button
                            key={language}
                            type="button"
                            onClick={() => updateAudienceList("languages", language)}
                            className={`rounded-full border px-3 py-1.5 text-xs ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">Only guests missing RSVP</p>
                      <p className="text-xs text-muted-foreground">Useful for reminders and final follow-up.</p>
                    </div>
                    <Switch
                      checked={Boolean(broadcastForm.audience.onlyMissingRsvp)}
                      onCheckedChange={(checked) =>
                        setBroadcastForm((current) => ({
                          ...current,
                          audience: {
                            ...current.audience,
                            onlyMissingRsvp: checked,
                          },
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="rounded-xl bg-muted/40 p-4 text-sm">
                  <p className="font-medium text-foreground">{estimatedBroadcastRecipients.length} guest(s) will receive this update</p>
                  <p className="mt-1 text-muted-foreground">
                    Guests without email are automatically excluded so bounces stay easy to read.
                  </p>
                </div>

                <Button disabled={!canSendBroadcasts || sendingBroadcast} onClick={sendBroadcast}>
                  {sendingBroadcast ? "Sending..." : "Send Update"}
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-semibold">Broadcast history</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      See what was sent, who opened it, who bounced, and which audiences still need follow-up.
                    </p>
                  </div>
                  <Badge variant="outline">{workspace.broadcasts.length} recent</Badge>
                </div>

                {workspace.broadcasts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    No broadcasts sent yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workspace.broadcasts.map((broadcast) => (
                      <details key={broadcast.id} className="rounded-xl border border-border p-5" open={workspace.broadcasts[0]?.id === broadcast.id}>
                        <summary className="cursor-pointer list-none">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-display text-xl font-semibold">{broadcast.title}</h3>
                                <Badge variant="secondary">{broadcast.type.replace(/_/g, " ")}</Badge>
                                <Badge variant="outline">{broadcast.language.toUpperCase()}</Badge>
                                <Badge variant={broadcast.status === "partial" ? "destructive" : "default"}>
                                  {broadcast.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{broadcast.message}</p>
                              <p className="text-xs text-muted-foreground">Sent {formatDate(broadcast.sentAt || broadcast.createdAt)}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div className="rounded-lg bg-muted/40 px-3 py-2">
                                <p className="text-lg font-display font-bold">{broadcast.stats?.sent ?? 0}</p>
                                <p className="text-[11px] text-muted-foreground">Sent</p>
                              </div>
                              <div className="rounded-lg bg-muted/40 px-3 py-2">
                                <p className="text-lg font-display font-bold">{broadcast.stats?.opened ?? 0}</p>
                                <p className="text-[11px] text-muted-foreground">Opened</p>
                              </div>
                              <div className="rounded-lg bg-muted/40 px-3 py-2">
                                <p className="text-lg font-display font-bold">{broadcast.stats?.bounced ?? 0}</p>
                                <p className="text-[11px] text-muted-foreground">Bounced</p>
                              </div>
                            </div>
                          </div>
                        </summary>

                        <div className="mt-4 space-y-3 border-t border-border pt-4">
                          {broadcast.recipients.map((recipient) => (
                            <div key={recipient.id} className="flex flex-col gap-2 rounded-lg bg-muted/30 p-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-medium text-foreground">{recipient.name || recipient.email}</p>
                                <p className="text-xs text-muted-foreground">{recipient.email}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="outline">{recipient.language.toUpperCase()}</Badge>
                                <Badge variant={recipient.status === "bounced" ? "destructive" : recipient.status === "opened" ? "default" : "secondary"}>
                                  {recipient.status}
                                </Badge>
                                {recipient.openedAt && <span className="text-muted-foreground">Opened {formatDate(recipient.openedAt)}</span>}
                                {recipient.errorMessage && <span className="text-destructive">{recipient.errorMessage}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}
          </TabsContent>

          <TabsContent value="workspace" className="space-y-6">
            {/* Orientation banner */}
            <div className="rounded-xl bg-muted/30 border border-border px-5 py-4 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground font-body">
                Invite a partner, planner, or assistant and control exactly what they can see and do. Only the owner can add or remove team members.
              </p>
            </div>
            {canManageCollaborators ? (
            <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-display text-2xl font-semibold">Multi-host access</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Invite a partner, planner, family member, or assistant and keep permissions limited to what they actually need.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Collaborator email</Label>
                    <Input value={collaboratorForm.email} onChange={(event) => setCollaboratorForm((current) => ({ ...current, email: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={collaboratorForm.name ?? ""} onChange={(event) => setCollaboratorForm((current) => ({ ...current, name: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role label</Label>
                    <Input value={collaboratorForm.roleLabel} onChange={(event) => setCollaboratorForm((current) => ({ ...current, roleLabel: event.target.value }))} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  {collaboratorPermissions.map((permission) => {
                    const active = collaboratorForm.permissions.includes(permission.key);
                    return (
                      <label key={permission.key} className="flex items-start gap-3 rounded-xl border border-border p-3">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() =>
                            setCollaboratorForm((current) => ({
                              ...current,
                              permissions: active
                                ? current.permissions.filter((entry) => entry !== permission.key)
                                : [...current.permissions, permission.key],
                            }))
                          }
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">{permission.label}</p>
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <Button disabled={!canManageCollaborators || savingCollaborator} onClick={inviteCollaborator}>
                  {savingCollaborator ? "Inviting..." : "Invite Collaborator"}
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-semibold">Current workspace members</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Buyers always keep full control. Collaborators only get the permissions you assign.
                    </p>
                  </div>
                  <Badge variant="outline">{workspace.collaborators.length + 1} total</Badge>
                </div>

                {pendingAccessRequests.length > 0 && (
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-foreground">Pending access requests</p>
                      <Badge variant="secondary">{pendingAccessRequests.length} pending</Badge>
                    </div>
                    {pendingAccessRequests.map((request) => (
                      <div key={request.id} className="rounded-lg border border-border bg-background p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="font-medium text-foreground">{request.requesterCollaborator?.name || request.requester?.name || request.requesterCollaborator?.email}</p>
                            <p className="text-sm text-muted-foreground">{request.requesterCollaborator?.email || request.requester?.email}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {request.requestedPermissions.map((permission) => (
                                <Badge key={permission} variant="outline">{permission.replace(/_/g, " ")}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" disabled={resolvingRequestId === request.id} onClick={() => approveAccessRequest(request.id)}>
                              {resolvingRequestId === request.id ? "Approving..." : "Approve"}
                            </Button>
                            <Button variant="outline" size="sm" disabled={resolvingRequestId === request.id} onClick={() => rejectAccessRequest(request.id)}>
                              {resolvingRequestId === request.id ? "Rejecting..." : "Reject"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="font-medium text-foreground">Buyer access</p>
                    <Badge variant="secondary">owner</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Full control over content, guests, broadcasts, translations, exports, and collaborators.
                  </p>
                </div>

                {workspace.collaborators.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    No collaborators added yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workspace.collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="rounded-xl border border-border p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-xl font-semibold">{collaborator.name || collaborator.email}</h3>
                              <Badge variant="secondary">{collaborator.roleLabel}</Badge>
                              <Badge variant={collaborator.status === "active" ? "default" : collaborator.status === "pending" ? "outline" : "destructive"}>
                                {collaborator.status}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{collaborator.email}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Invited {formatDate(collaborator.invitedAt)}{collaborator.joinedAt ? ` - Joined ${formatDate(collaborator.joinedAt)}` : ""}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {collaborator.permissions.map((permission) => (
                                <Badge key={permission} variant="outline">{permission.replace(/_/g, " ")}</Badge>
                              ))}
                            </div>
                          </div>
                          <Button variant="destructive" size="sm" disabled={!canManageCollaborators || removingId === collaborator.id} onClick={() => removeCollaborator(collaborator.id)}>
                            {removingId === collaborator.id ? "Removing..." : "Remove"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <h2 className="font-display text-2xl font-semibold">Your current access</h2>
                  <p className="text-sm text-muted-foreground">
                    You can only see the parts of this workspace that match your assigned permissions. Request extra access from the buyer when needed.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {workspace.permissions.length === 0 ? (
                      <Badge variant="outline">No workspace permissions</Badge>
                    ) : (
                      workspace.permissions.map((permission) => (
                        <Badge key={permission} variant="outline">{permission.replace(/_/g, " ")}</Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl font-semibold">Request more access</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Select exactly what you need. The buyer will see the request in this workspace and can approve or reject it.
                      </p>
                    </div>
                    <Badge variant="outline">{workspace.requestablePermissions.length} requestable</Badge>
                  </div>

                  <div className="space-y-3">
                    {collaboratorPermissions.map((permission) => {
                      const hasPermission = workspace.permissions.includes(permission.key);
                      const pendingRequest = getRequestStatus([permission.key]);
                      const isRequestable = workspace.requestablePermissions.includes(permission.key);

                      return (
                        <div key={permission.key} className="rounded-xl border border-border p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="font-medium text-foreground">{permission.label}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{permission.description}</p>
                            </div>
                            {hasPermission ? (
                              <Badge variant="secondary">Granted</Badge>
                            ) : pendingRequest ? (
                              <Badge variant="outline">Pending</Badge>
                            ) : (
                              <Button size="sm" disabled={!isRequestable} onClick={() => requestAccess([permission.key])}>
                                Request access
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {workspace.myAccessRequests.length > 0 && (
                    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                      <p className="font-medium text-foreground">Your request history</p>
                      {workspace.myAccessRequests.map((request) => (
                        <div key={request.id} className="rounded-lg border border-border bg-background p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={request.status === "approved" ? "secondary" : request.status === "rejected" ? "destructive" : "outline"}>
                              {request.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Requested {formatDate(request.requestedAt)}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {request.requestedPermissions.map((permission) => (
                              <Badge key={permission} variant="outline">{permission.replace(/_/g, " ")}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="languages" className="space-y-6">
            {/* Orientation banner */}
            <div className="rounded-xl bg-muted/30 border border-border px-5 py-4 flex items-start gap-3">
              <Globe2 className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground font-body">
                Enable and translate your invite for multi-language audiences. Guests can switch languages directly from the live invite page.
              </p>
            </div>
            {!canEditInviteSetup ? renderLockedState(
              "Multilingual guest experience",
              "Only collaborators with content access can change invite languages and translation settings.",
              ["edit_content"]
            ) : (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <Globe2 className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-display text-2xl font-semibold">Multilingual guest experience</h2>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      Choose guest-facing languages, set the default experience, add translated section content, and localize RSVP questions.
                    </p>
                  </div>
                </div>
                <Button disabled={!canEditInviteSetup || savingLanguageSetup} onClick={saveLanguages}>
                  {savingLanguageSetup ? "Saving..." : "Save Language Setup"}
                </Button>
              </div>

              <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-6">
                  <div className="rounded-xl border border-border p-5 space-y-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold">Enabled languages</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Guests can switch between any enabled languages from their invite page.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {availableLanguages.map((language) => {
                        const active = localizationForm.enabledLanguages.includes(language.code);
                        return (
                          <label key={language.code} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{language.label}</p>
                              <p className="text-xs text-muted-foreground">{language.code.toUpperCase()}</p>
                            </div>
                            <Switch checked={active} disabled={!canEditInviteSetup} onCheckedChange={() => toggleLanguage(language.code)} />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-5 space-y-3">
                    <Label>Default language</Label>
                    <select
                      disabled={!canEditInviteSetup}
                      value={localizationForm.defaultLanguage}
                      onChange={(event) =>
                        setLocalizationForm((current) => current ? { ...current, defaultLanguage: event.target.value } : current)
                      }
                      className="w-full rounded-md border border-border bg-background px-3 py-2"
                    >
                      {localizationForm.enabledLanguages.map((language) => (
                        <option key={language} value={language}>
                          {availableLanguages.find((item) => item.code === language)?.label ?? language}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Unique guest links already include `lang=` so the correct language can open by default.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border p-5 space-y-3">
                    <p className="font-medium text-foreground">Quick live links</p>
                    {localizationForm.enabledLanguages.map((language) => {
                      const value = `${window.location.origin}/i/${workspace.invite.slug}?lang=${language}`;
                      return (
                        <div key={language} className="rounded-lg bg-muted/40 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {availableLanguages.find((item) => item.code === language)?.label ?? language}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">{value}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => copyText(value, "Live link copied")}>
                              <Copy className="mr-1 h-4 w-4" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-border p-5 space-y-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold">Translated invite content</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add translated values for the sections guests actually read. Leave empty fields to fall back to the base invite content.
                      </p>
                    </div>

                    {secondaryLanguages.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                        Add at least one extra language to enable content translation.
                      </div>
                    ) : (
                      <>
                        {/* Per-language auto-translate buttons */}
                        <div className="flex flex-wrap gap-2">
                          {secondaryLanguages.map((language) => {
                            const isTranslatingThis = autoTranslatingLang === language;
                            const langLabel = availableLanguages.find((item) => item.code === language)?.label ?? language;
                            return (
                              <Button
                                key={language}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                disabled={!canEditInviteSetup || autoTranslatingLang !== null}
                                onClick={() => void autoTranslateLanguage(language)}
                              >
                                {isTranslatingThis ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Translating {autoTranslateProgress?.done}/{autoTranslateProgress?.total}…
                                  </>
                                ) : (
                                  <>
                                    <Languages className="h-3 w-3" />
                                    Auto-translate to {langLabel}
                                  </>
                                )}
                              </Button>
                            );
                          })}
                        </div>

                        <div className="space-y-5">
                          {translatableFields.map((field) => (
                            <div key={field.key} className="rounded-xl border border-border p-4">
                              <div className="mb-3">
                                <p className="font-medium text-foreground">{field.label}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{field.value}</p>
                              </div>
                              <div className="grid gap-4 lg:grid-cols-2">
                                {secondaryLanguages.map((language) => {
                                  const isTranslatingThis = translatingFieldKey === `${language}:${field.key}`;
                                  const langLabel = availableLanguages.find((item) => item.code === language)?.label ?? language;
                                  return (
                                    <div key={language} className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label>{langLabel}</Label>
                                        <button
                                          type="button"
                                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                          disabled={!canEditInviteSetup || isTranslatingThis || autoTranslatingLang !== null}
                                          onClick={() => void translateOneField(language, field.key, field.value)}
                                          title={`Translate to ${langLabel}`}
                                        >
                                          {isTranslatingThis ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Languages className="h-3 w-3" />
                                          )}
                                        </button>
                                      </div>
                                      <Textarea
                                        disabled={!canEditInviteSetup}
                                        value={String(localizationForm.translations[language]?.[field.key] ?? "")}
                                        onChange={(event) => setTranslationValue(language, field.key, event.target.value)}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="rounded-xl border border-border p-5 space-y-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold">Localized RSVP questions</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Translate only the host questions you added to the RSVP form. Standard RSVP field labels are localized automatically.
                      </p>
                    </div>

                    {rsvpForm.customQuestions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                        No custom RSVP questions to translate yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {rsvpForm.customQuestions.map((question, index) => (
                          <div key={question.id} className="rounded-xl border border-border p-4">
                            <p className="font-medium text-foreground">{question.label}</p>
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              {secondaryLanguages.map((language) => (
                                <div key={language} className="space-y-2">
                                  <Label>
                                    {availableLanguages.find((item) => item.code === language)?.label ?? language}
                                  </Label>
                                  <Input
                                    disabled={!canEditInviteSetup}
                                    value={question.translations?.[language] ?? ""}
                                    onChange={(event) => setQuestionTranslation(index, language, event.target.value)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}
          </TabsContent>

          <TabsContent value="ops" className="space-y-6">
            {/* Orientation banner */}
            <div className="rounded-xl bg-muted/30 border border-border px-5 py-4 flex items-start gap-3">
              <Download className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground font-body">
                Download your guest list, logistics data, and event summaries. Share these files with caterers, venue teams, and coordinators.
              </p>
            </div>
            {!canViewReports ? renderLockedState(
              "Export and reports",
              "Only collaborators with reporting access can view operational summaries and export packs.",
              ["view_reports"]
            ) : (
            <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Adults</p>
                <p className="mt-2 text-3xl font-display font-bold">{summary.totals.adults}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Children</p>
                <p className="mt-2 text-3xl font-display font-bold">{summary.totals.children}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Transport Requests</p>
                <p className="mt-2 text-3xl font-display font-bold">{summary.totals.transportRequests}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Missing Alerts</p>
                <p className="mt-2 text-3xl font-display font-bold">{summary.missingInfoAlerts.length}</p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="font-display text-2xl font-semibold">RSVP automation summary</h2>

                <div className="space-y-4">
                  <div className="rounded-xl bg-muted/40 p-4">
                    <p className="text-sm font-medium text-foreground">Final meal counts</p>
                    <div className="mt-3 grid gap-2">
                      {Object.keys(summary.mealCounts).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No meal data yet.</p>
                      ) : (
                        Object.entries(summary.mealCounts).map(([label, count]) => (
                          <div key={label} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium text-foreground">{count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-4">
                    <p className="text-sm font-medium text-foreground">Room requirement summary</p>
                    <div className="mt-3 grid gap-2">
                      {Object.keys(summary.roomSummary).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No room requests yet.</p>
                      ) : (
                        Object.entries(summary.roomSummary).map(([label, entry]) => (
                          <div key={label} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium text-foreground">{entry.rooms} room(s) / {entry.guests} guest(s)</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-4">
                    <p className="text-sm font-medium text-foreground">Transport demand summary</p>
                    <div className="mt-3 grid gap-2">
                      {Object.keys(summary.transportSummary).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No transport demand yet.</p>
                      ) : (
                        Object.entries(summary.transportSummary).map(([label, count]) => (
                          <div key={label} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium text-foreground">{count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="font-display text-2xl font-semibold">Operational follow-ups</h2>

                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-sm font-medium text-foreground">Recommended next tasks</p>
                  <div className="mt-3 space-y-2">
                    {summary.followUpTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No urgent follow-ups right now.</p>
                    ) : (
                      summary.followUpTasks.map((task) => (
                        <p key={task} className="rounded-lg bg-background p-3 text-sm text-foreground">{task}</p>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-sm font-medium text-foreground">Missing information alerts</p>
                  <div className="mt-3 space-y-2">
                    {summary.missingInfoAlerts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No missing information alerts.</p>
                    ) : (
                      summary.missingInfoAlerts.map((alert, index) => (
                        <p key={`${alert}-${index}`} className="rounded-lg bg-background p-3 text-sm text-foreground">{alert}</p>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold">Event ops pack</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        One-click CSV exports for caterers, venue teams, welcome desk, room blocks, shuttle ops, and family photo coordination.
                      </p>
                    </div>
                    <Button variant="outline" disabled={!canViewReports || loadingExportPack} onClick={loadExportPack}>
                      {loadingExportPack ? "Generating..." : "Generate Pack"}
                    </Button>
                  </div>

                  {exportPack && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <p className="text-muted-foreground">Generated {formatDate(exportPack.generatedAt)}</p>
                        <Button
                          size="sm"
                          onClick={() => exportPack.files.forEach((file) => downloadTextFile(file.filename, file.content))}
                        >
                          <Download className="mr-1 h-4 w-4" />
                          Download All
                        </Button>
                      </div>

                      {exportPack.files.map((file) => (
                        <div key={file.filename} className="flex flex-col gap-3 rounded-lg bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium text-foreground">{file.filename}</p>
                            <p className="text-xs text-muted-foreground">Ready for vendors, coordinators, and front-desk teams.</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => downloadTextFile(file.filename, file.content)}>
                            Download CSV
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InviteOperations;
