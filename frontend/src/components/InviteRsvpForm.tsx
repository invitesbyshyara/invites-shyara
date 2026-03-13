import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { CustomRsvpQuestion, RsvpSettings } from "@/types";

interface InviteRsvpFormProps {
  inviteId: string;
  accentColor?: string;
  className?: string;
}

const inputCls = "w-full rounded-xl border border-border bg-background px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const formCopy = {
  en: {
    closedTitle: "RSVPs Closed",
    closedText: "The RSVP deadline for this event has passed. Please contact the host directly.",
    thankYou: "Thank You",
    yesText: "We are looking forward to celebrating with you.",
    maybeText: "We hope you can make it.",
    noText: "Thank you for letting the host know.",
    name: "Your name",
    email: "Email address",
    phone: "Phone number",
    household: "Household or family name",
    response: "Your response",
    guests: "Total guests",
    adults: "Adults",
    children: "Children",
    meal: "Meal choice",
    dietary: "Dietary notes or allergies",
    stayToggle: "Need accommodation support",
    room: "Room preference or requirement",
    travelToggle: "Need transport support",
    travelMode: "Transport details",
    message: "Leave a note for the host",
    submit: "Send RSVP",
    sending: "Sending...",
    reservedFor: "Reserved for",
    attending: "Attending",
    unable: "Not attending",
    maybe: "Maybe",
    yesNoPlaceholder: "Choose",
    yes: "Yes",
    no: "No",
    guestHint: "Guest-specific details were prefilled from your link.",
    error: "Could not send RSVP. Please try again.",
  },
  es: {
    closedTitle: "RSVP Cerrado",
    closedText: "La fecha limite de confirmacion ya paso. Contacta al anfitrion directamente.",
    thankYou: "Gracias",
    yesText: "Nos encantara celebrar contigo.",
    maybeText: "Esperamos que puedas asistir.",
    noText: "Gracias por avisarle al anfitrion.",
    name: "Tu nombre",
    email: "Correo electronico",
    phone: "Telefono",
    household: "Familia o grupo",
    response: "Tu respuesta",
    guests: "Total de invitados",
    adults: "Adultos",
    children: "Ninos",
    meal: "Comida",
    dietary: "Alergias o notas alimentarias",
    stayToggle: "Necesito ayuda con hospedaje",
    room: "Preferencia o necesidad de habitacion",
    travelToggle: "Necesito ayuda con transporte",
    travelMode: "Detalles de transporte",
    message: "Deja una nota para el anfitrion",
    submit: "Enviar RSVP",
    sending: "Enviando...",
    reservedFor: "Reservado para",
    attending: "Asistire",
    unable: "No asistire",
    maybe: "Tal vez",
    yesNoPlaceholder: "Elegir",
    yes: "Si",
    no: "No",
    guestHint: "Los datos del invitado se precargaron desde tu enlace.",
    error: "No se pudo enviar la respuesta. Intentalo de nuevo.",
  },
  fr: {
    closedTitle: "RSVP Ferme",
    closedText: "La date limite de reponse est passee. Merci de contacter l'hote directement.",
    thankYou: "Merci",
    yesText: "Nous avons hate de celebrer avec vous.",
    maybeText: "Nous esperons vous voir a l'evenement.",
    noText: "Merci d'avoir informe l'hote.",
    name: "Votre nom",
    email: "Adresse e-mail",
    phone: "Telephone",
    household: "Famille ou foyer",
    response: "Votre reponse",
    guests: "Nombre total d'invites",
    adults: "Adultes",
    children: "Enfants",
    meal: "Choix du repas",
    dietary: "Restrictions alimentaires",
    stayToggle: "Besoin d'aide pour l'hebergement",
    room: "Preference ou besoin de chambre",
    travelToggle: "Besoin d'aide pour le transport",
    travelMode: "Details du transport",
    message: "Laissez un message a l'hote",
    submit: "Envoyer le RSVP",
    sending: "Envoi...",
    reservedFor: "Reserve pour",
    attending: "Je participe",
    unable: "Je ne participe pas",
    maybe: "Peut-etre",
    yesNoPlaceholder: "Choisir",
    yes: "Oui",
    no: "Non",
    guestHint: "Les informations du convive ont ete pre-remplies depuis votre lien.",
    error: "Impossible d'envoyer la reponse. Veuillez reessayer.",
  },
  de: {
    closedTitle: "RSVP Geschlossen",
    closedText: "Die RSVP-Frist ist abgelaufen. Bitte kontaktiere den Gastgeber direkt.",
    thankYou: "Danke",
    yesText: "Wir freuen uns darauf, mit dir zu feiern.",
    maybeText: "Wir hoffen, dass du dabei sein kannst.",
    noText: "Danke, dass du dem Gastgeber Bescheid gibst.",
    name: "Dein Name",
    email: "E-Mail-Adresse",
    phone: "Telefonnummer",
    household: "Haushalt oder Familie",
    response: "Deine Antwort",
    guests: "Gesamtzahl der Gaste",
    adults: "Erwachsene",
    children: "Kinder",
    meal: "Essenswahl",
    dietary: "Allergien oder Hinweise",
    stayToggle: "Unterkunft erforderlich",
    room: "Zimmerwunsch oder Bedarf",
    travelToggle: "Transporthilfe erforderlich",
    travelMode: "Transportdetails",
    message: "Nachricht an den Gastgeber",
    submit: "RSVP senden",
    sending: "Wird gesendet...",
    reservedFor: "Reserviert fur",
    attending: "Ich komme",
    unable: "Ich komme nicht",
    maybe: "Vielleicht",
    yesNoPlaceholder: "Auswahlen",
    yes: "Ja",
    no: "Nein",
    guestHint: "Die Gastdaten wurden aus deinem Link vorausgefullt.",
    error: "Die RSVP konnte nicht gesendet werden. Bitte versuche es erneut.",
  },
  it: {
    closedTitle: "RSVP Chiuso",
    closedText: "La scadenza RSVP e passata. Contatta direttamente l'organizzatore.",
    thankYou: "Grazie",
    yesText: "Non vediamo l'ora di festeggiare con te.",
    maybeText: "Speriamo che tu possa partecipare.",
    noText: "Grazie per aver avvisato l'organizzatore.",
    name: "Il tuo nome",
    email: "Email",
    phone: "Telefono",
    household: "Famiglia o nucleo",
    response: "La tua risposta",
    guests: "Totale ospiti",
    adults: "Adulti",
    children: "Bambini",
    meal: "Scelta del pasto",
    dietary: "Allergie o note alimentari",
    stayToggle: "Serve aiuto per l'alloggio",
    room: "Preferenza o esigenza camera",
    travelToggle: "Serve aiuto per il trasporto",
    travelMode: "Dettagli del trasporto",
    message: "Lascia un messaggio all'organizzatore",
    submit: "Invia RSVP",
    sending: "Invio...",
    reservedFor: "Riservato per",
    attending: "Partecipo",
    unable: "Non partecipo",
    maybe: "Forse",
    yesNoPlaceholder: "Seleziona",
    yes: "Si",
    no: "No",
    guestHint: "I dati ospite sono stati precompilati dal tuo link.",
    error: "Impossibile inviare l'RSVP. Riprova.",
  },
} as const;

const getQuestionLabel = (question: CustomRsvpQuestion, language: string) =>
  question.translations?.[language] || question.label;

const InviteRsvpForm = ({ inviteId, accentColor, className = "" }: InviteRsvpFormProps) => {
  const [searchParams] = useSearchParams();
  const guestToken = searchParams.get("guest") || undefined;
  const requestedLanguage = searchParams.get("lang") || undefined;

  const [config, setConfig] = useState<RsvpSettings | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const hydratedKeyRef = useRef<string>("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    household: "",
    response: "yes" as "yes" | "no" | "maybe",
    guestCount: 1,
    adultCount: 0,
    childCount: 0,
    message: "",
    mealChoice: "",
    dietaryRestrictions: "",
    stayNeeded: false,
    roomRequirement: "",
    transportNeeded: false,
    transportMode: "",
    customAnswers: {} as Record<string, unknown>,
  });
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const hydrateKey = `${inviteId}:${guestToken || "open"}`;
    setConfigLoading(true);

    api.getRsvpConfig(inviteId, { guestToken, language: requestedLanguage })
      .then((cfg) => {
        if (!mounted) return;
        setConfig(cfg);
        setDeadlinePassed(Boolean(cfg.deadline && new Date(cfg.deadline) < new Date()));
        if (hydratedKeyRef.current !== hydrateKey) {
          hydratedKeyRef.current = hydrateKey;
          setForm((current) => ({
            ...current,
            name: cfg.viewer?.name || "",
            email: cfg.viewer?.email || "",
            phone: cfg.viewer?.phone || "",
            household: cfg.viewer?.household || "",
            response: cfg.viewer?.response || "yes",
            guestCount: Math.min(cfg.viewer?.guestCount || 1, cfg.maxGuestCount || 1),
            adultCount: cfg.viewer?.adultCount || 0,
            childCount: cfg.viewer?.childCount || 0,
            message: "",
            mealChoice: cfg.viewer?.mealChoice || "",
            dietaryRestrictions: cfg.viewer?.dietaryRestrictions || "",
            stayNeeded: cfg.viewer?.stayNeeded || false,
            roomRequirement: cfg.viewer?.roomRequirement || "",
            transportNeeded: cfg.viewer?.transportNeeded || false,
            transportMode: cfg.viewer?.transportMode || "",
            customAnswers: {
              ...(cfg.viewer?.customAnswers ?? {}),
            },
          }));
        } else {
          setForm((current) => ({
            ...current,
            guestCount: Math.min(current.guestCount || 1, cfg.maxGuestCount || 1),
          }));
        }
      })
      .catch(() => {
        if (mounted) {
          setSubmitError(formCopy.en.error);
        }
      })
      .finally(() => {
        if (mounted) {
          setConfigLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [guestToken, inviteId, requestedLanguage]);

  const language = config?.language || requestedLanguage || "en";
  const copy = formCopy[language as keyof typeof formCopy] || formCopy.en;
  const activeQuestions = config?.customQuestions ?? [];
  const showStayFields = form.response === "yes" && Boolean(config?.collectStayNeeds);
  const showTravelFields = form.response === "yes" && Boolean(config?.collectTravelPlans);
  const effectiveGuestCount = config?.allowPlusOnes === false
    ? Math.min(config.viewer?.guestCount || 1, config.maxGuestCount || 1)
    : Math.max(1, Math.min(form.guestCount, config?.maxGuestCount || 1));

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    return activeQuestions.every((question) => {
      if (!question.required) return true;
      const value = form.customAnswers[question.id];
      if (question.type === "boolean") return typeof value === "boolean";
      if (question.type === "number") return value !== undefined && value !== null && String(value).trim() !== "";
      return typeof value === "string" && value.trim().length > 0;
    });
  }, [activeQuestions, form.customAnswers, form.name]);

  const updateForm = (key: keyof typeof form, value: unknown) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateCustomAnswer = (questionId: string, value: unknown) => {
    setForm((current) => ({
      ...current,
      customAnswers: {
        ...current.customAnswers,
        [questionId]: value,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!config || !canSubmit) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      await api.submitRsvp(inviteId, {
        guestToken,
        language,
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        household: form.household.trim() || undefined,
        response: form.response,
        guestCount: form.response === "yes" ? effectiveGuestCount : 1,
        adultCount: form.response === "yes" && config.collectAdultsChildrenSplit ? form.adultCount : undefined,
        childCount: form.response === "yes" && config.collectAdultsChildrenSplit ? form.childCount : undefined,
        message: form.message.trim() || undefined,
        mealChoice: form.response === "yes" ? form.mealChoice || undefined : undefined,
        dietaryRestrictions: form.response === "yes" ? form.dietaryRestrictions.trim() || undefined : undefined,
        stayNeeded: showStayFields ? form.stayNeeded : undefined,
        roomRequirement: showStayFields && form.stayNeeded ? form.roomRequirement.trim() || undefined : undefined,
        transportNeeded: showTravelFields ? form.transportNeeded : undefined,
        transportMode: showTravelFields && form.transportNeeded ? form.transportMode.trim() || undefined : undefined,
        customAnswers: Object.fromEntries(
          Object.entries(form.customAnswers).filter(([, value]) => value !== "" && value !== undefined && value !== null)
        ),
      });
      setSubmitted(true);
    } catch (error: unknown) {
      const result = error as { status?: number; message?: string };
      if (result.status === 410) {
        setDeadlinePassed(true);
      } else {
        setSubmitError(result.message || copy.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitStyle = accentColor ? { backgroundColor: accentColor, borderColor: accentColor } : undefined;

  if (configLoading && !config) {
    return (
      <div className={`py-10 text-center ${className}`}>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (deadlinePassed) {
    return (
      <div className={`py-12 text-center ${className}`}>
        <h3 className="mb-2 font-display text-2xl font-bold">{copy.closedTitle}</h3>
        <p className="font-body text-sm text-muted-foreground">{copy.closedText}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={`py-12 text-center ${className}`}>
        <h3 className="mb-2 font-display text-2xl font-bold">{copy.thankYou}</h3>
        <p className="font-body text-sm text-muted-foreground">
          {form.response === "yes" ? copy.yesText : form.response === "maybe" ? copy.maybeText : copy.noText}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 text-left ${className}`}>
      {config?.viewer && (
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm font-medium text-foreground">{copy.reservedFor} {config.viewer.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.guestHint}</p>
        </div>
      )}

      <input
        type="text"
        placeholder={copy.name}
        value={form.name}
        onChange={(event) => updateForm("name", event.target.value)}
        required
        className={inputCls}
      />

      {config?.collectEmail && (
        <input
          type="email"
          placeholder={copy.email}
          value={form.email}
          onChange={(event) => updateForm("email", event.target.value)}
          className={inputCls}
        />
      )}

      {config?.collectPhone && (
        <input
          type="text"
          placeholder={copy.phone}
          value={form.phone}
          onChange={(event) => updateForm("phone", event.target.value)}
          className={inputCls}
        />
      )}

      {config?.collectHousehold && (
        <input
          type="text"
          placeholder={copy.household}
          value={form.household}
          onChange={(event) => updateForm("household", event.target.value)}
          className={inputCls}
        />
      )}

      <div className="flex gap-2">
        {([
          { value: "yes", label: copy.attending },
          { value: "no", label: copy.unable },
          { value: "maybe", label: copy.maybe },
        ] as const).map((option) => {
          const active = form.response === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateForm("response", option.value)}
              style={active ? submitStyle : undefined}
              className={`flex-1 rounded-xl border py-3 font-body text-sm font-medium transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-accent"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {form.response === "yes" && config && (
        <>
          {config.allowPlusOnes ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{copy.guests}</label>
              <input
                type="number"
                min={1}
                max={config.maxGuestCount}
                value={effectiveGuestCount}
                onChange={(event) => updateForm("guestCount", Number(event.target.value) || 1)}
                className={inputCls}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <p className="font-medium text-foreground">{copy.reservedFor} {effectiveGuestCount} guest(s)</p>
            </div>
          )}

          {config.collectAdultsChildrenSplit && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{copy.adults}</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={form.adultCount}
                  onChange={(event) => updateForm("adultCount", Number(event.target.value) || 0)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{copy.children}</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={form.childCount}
                  onChange={(event) => updateForm("childCount", Number(event.target.value) || 0)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {config.collectMealChoice && config.mealOptions.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{copy.meal}</label>
              <select
                value={form.mealChoice}
                onChange={(event) => updateForm("mealChoice", event.target.value)}
                className={inputCls}
              >
                <option value="">{copy.yesNoPlaceholder}</option>
                {config.mealOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}

          {config.collectDietaryRestrictions && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{copy.dietary}</label>
              <textarea
                rows={3}
                value={form.dietaryRestrictions}
                onChange={(event) => updateForm("dietaryRestrictions", event.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>
          )}

          {showStayFields && (
            <div className="rounded-xl border border-border p-4 space-y-3">
              <label className="flex items-center justify-between gap-3 text-sm font-medium text-foreground">
                <span>{copy.stayToggle}</span>
                <input
                  type="checkbox"
                  checked={form.stayNeeded}
                  onChange={(event) => updateForm("stayNeeded", event.target.checked)}
                />
              </label>
              {form.stayNeeded && (
                <input
                  type="text"
                  placeholder={copy.room}
                  value={form.roomRequirement}
                  onChange={(event) => updateForm("roomRequirement", event.target.value)}
                  className={inputCls}
                />
              )}
            </div>
          )}

          {showTravelFields && (
            <div className="rounded-xl border border-border p-4 space-y-3">
              <label className="flex items-center justify-between gap-3 text-sm font-medium text-foreground">
                <span>{copy.travelToggle}</span>
                <input
                  type="checkbox"
                  checked={form.transportNeeded}
                  onChange={(event) => updateForm("transportNeeded", event.target.checked)}
                />
              </label>
              {form.transportNeeded && (
                <input
                  type="text"
                  placeholder={copy.travelMode}
                  value={form.transportMode}
                  onChange={(event) => updateForm("transportMode", event.target.value)}
                  className={inputCls}
                />
              )}
            </div>
          )}
        </>
      )}

      {activeQuestions.map((question) => {
        const label = getQuestionLabel(question, language);
        const value = form.customAnswers[question.id];

        if (question.type === "textarea") {
          return (
            <div key={question.id} className="space-y-2">
              <label className="text-sm font-medium text-foreground">{label}{question.required ? " *" : ""}</label>
              <textarea
                rows={3}
                value={String(value ?? "")}
                onChange={(event) => updateCustomAnswer(question.id, event.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>
          );
        }

        if (question.type === "select") {
          return (
            <div key={question.id} className="space-y-2">
              <label className="text-sm font-medium text-foreground">{label}{question.required ? " *" : ""}</label>
              <select
                value={String(value ?? "")}
                onChange={(event) => updateCustomAnswer(question.id, event.target.value)}
                className={inputCls}
              >
                <option value="">{copy.yesNoPlaceholder}</option>
                {(question.options ?? []).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          );
        }

        if (question.type === "boolean") {
          return (
            <div key={question.id} className="space-y-2">
              <label className="text-sm font-medium text-foreground">{label}{question.required ? " *" : ""}</label>
              <select
                value={typeof value === "boolean" ? String(value) : ""}
                onChange={(event) => updateCustomAnswer(question.id, event.target.value === "" ? undefined : event.target.value === "true")}
                className={inputCls}
              >
                <option value="">{copy.yesNoPlaceholder}</option>
                <option value="true">{copy.yes}</option>
                <option value="false">{copy.no}</option>
              </select>
            </div>
          );
        }

        if (question.type === "number") {
          return (
            <div key={question.id} className="space-y-2">
              <label className="text-sm font-medium text-foreground">{label}{question.required ? " *" : ""}</label>
              <input
                type="number"
                value={String(value ?? "")}
                onChange={(event) => updateCustomAnswer(question.id, event.target.value)}
                className={inputCls}
              />
            </div>
          );
        }

        return (
          <div key={question.id} className="space-y-2">
            <label className="text-sm font-medium text-foreground">{label}{question.required ? " *" : ""}</label>
            <input
              type="text"
              value={String(value ?? "")}
              onChange={(event) => updateCustomAnswer(question.id, event.target.value)}
              className={inputCls}
            />
          </div>
        );
      })}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{copy.message}</label>
        <textarea
          rows={3}
          value={form.message}
          onChange={(event) => updateForm("message", event.target.value)}
          className={`${inputCls} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !canSubmit}
        style={submitStyle}
        className="w-full rounded-xl bg-primary py-3.5 font-body text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? copy.sending : copy.submit}
      </button>

      {submitError && (
        <p className="text-center text-xs font-body text-destructive">{submitError}</p>
      )}
    </form>
  );
};

export default InviteRsvpForm;
