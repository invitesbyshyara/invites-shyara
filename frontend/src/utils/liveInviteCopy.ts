export type GuestLanguage = "en" | "es" | "fr" | "de" | "it";

type LiveInviteCopy = {
  language: string;
  yourInvited: string;
  openInvitation: string;
  skipIntro: string;
  togetherWithFamilies: string;
  inviteYouToCelebrate: string;
  categoryLabels: Record<string, string>;
  ourStory: string;
  eventSchedule: string;
  venue: string;
  gallery: string;
  rsvp: string;
  wedLoveToHearFromYou: string;
  countrysideCelebration: string;
  rusticCelebration: string;
  areTyingTheKnot: string;
  thePlan: string;
  theVenue: string;
  wedLoveToHaveYouThere: string;
  giftRegistry: string;
  accommodation: string;
  groupCode: string;
  book: string;
  addToCalendar: string;
  googleCalendar: string;
  appleOutlook: string;
  directions: string;
  watchOurStory: string;
  thankYou: string;
  thankYouMessageFallback: string;
  visitShyara: string;
  poweredBy: string;
  invitationRemovedTitle: string;
  invitationRemovedDescription: string;
  invitationMissingTitle: string;
  invitationMissingDescription: string;
  templateUnavailableTitle: string;
  templateUnavailableDescription: string;
};

const liveInviteCopy: Record<GuestLanguage, LiveInviteCopy> = {
  en: {
    language: "Language",
    yourInvited: "You're Invited",
    openInvitation: "Open Invitation",
    skipIntro: "Skip Intro",
    togetherWithFamilies: "Together with their families",
    inviteYouToCelebrate: "invite you to celebrate their",
    categoryLabels: {
      wedding: "wedding",
      engagement: "engagement",
      birthday: "birthday",
      "baby-shower": "baby shower",
      corporate: "event",
      anniversary: "anniversary",
    },
    ourStory: "Our Story",
    eventSchedule: "Event Schedule",
    venue: "Venue",
    gallery: "Gallery",
    rsvp: "RSVP",
    wedLoveToHearFromYou: "We'd love to hear from you",
    countrysideCelebration: "A Countryside Celebration",
    rusticCelebration: "A Rustic Celebration",
    areTyingTheKnot: "are tying the knot",
    thePlan: "The Plan",
    theVenue: "The Venue",
    wedLoveToHaveYouThere: "We'd love to have you there",
    giftRegistry: "Gift Registry",
    accommodation: "Accommodation",
    groupCode: "Group code",
    book: "Book",
    addToCalendar: "Add to Calendar",
    googleCalendar: "Google Calendar",
    appleOutlook: "Apple / Outlook (.ics)",
    directions: "Directions",
    watchOurStory: "Watch Our Story",
    thankYou: "Thank You",
    thankYouMessageFallback: "Thank you for celebrating with us!",
    visitShyara: "Visit Shyara",
    poweredBy: "Powered by",
    invitationRemovedTitle: "This Invitation Is No Longer Available",
    invitationRemovedDescription: "The host has removed this invitation. If you believe this is a mistake, please contact the event organizer directly.",
    invitationMissingTitle: "Invitation Not Found",
    invitationMissingDescription: "This invite link may be incorrect, unpublished, removed, or no longer available. Please contact the host if you expected to see an active invitation.",
    templateUnavailableTitle: "Template Unavailable",
    templateUnavailableDescription: "The invite exists, but its template is not available right now. Please contact the host for help.",
  },
  es: {
    language: "Idioma",
    yourInvited: "Estás invitado",
    openInvitation: "Abrir invitación",
    skipIntro: "Saltar introducción",
    togetherWithFamilies: "Junto a sus familias",
    inviteYouToCelebrate: "te invitan a celebrar su",
    categoryLabels: {
      wedding: "boda",
      engagement: "compromiso",
      birthday: "cumpleaños",
      "baby-shower": "baby shower",
      corporate: "evento",
      anniversary: "aniversario",
    },
    ourStory: "Nuestra historia",
    eventSchedule: "Programa del evento",
    venue: "Lugar",
    gallery: "Galería",
    rsvp: "Confirmación",
    wedLoveToHearFromYou: "Nos encantará saber de ti",
    countrysideCelebration: "Una celebración en el campo",
    rusticCelebration: "Una celebración rústica",
    areTyingTheKnot: "se casan",
    thePlan: "El plan",
    theVenue: "El lugar",
    wedLoveToHaveYouThere: "Nos encantará contar contigo",
    giftRegistry: "Mesa de regalos",
    accommodation: "Alojamiento",
    groupCode: "Código de grupo",
    book: "Reservar",
    addToCalendar: "Agregar al calendario",
    googleCalendar: "Google Calendar",
    appleOutlook: "Apple / Outlook (.ics)",
    directions: "Cómo llegar",
    watchOurStory: "Mira nuestra historia",
    thankYou: "Gracias",
    thankYouMessageFallback: "Gracias por celebrar con nosotros.",
    visitShyara: "Visitar Shyara",
    poweredBy: "Powered by",
    invitationRemovedTitle: "Esta invitación ya no está disponible",
    invitationRemovedDescription: "El anfitrión retiró esta invitación. Si crees que es un error, contacta directamente al organizador.",
    invitationMissingTitle: "Invitación no encontrada",
    invitationMissingDescription: "Este enlace puede ser incorrecto, no estar publicado, haber sido retirado o ya no estar disponible. Contacta al anfitrión si esperabas ver una invitación activa.",
    templateUnavailableTitle: "Plantilla no disponible",
    templateUnavailableDescription: "La invitación existe, pero su plantilla no está disponible en este momento. Contacta al anfitrión para recibir ayuda.",
  },
  fr: {
    language: "Langue",
    yourInvited: "Vous êtes invité",
    openInvitation: "Ouvrir l'invitation",
    skipIntro: "Passer l'intro",
    togetherWithFamilies: "Avec leurs familles",
    inviteYouToCelebrate: "vous invitent à célébrer leur",
    categoryLabels: {
      wedding: "mariage",
      engagement: "fiançailles",
      birthday: "anniversaire",
      "baby-shower": "baby shower",
      corporate: "événement",
      anniversary: "anniversaire",
    },
    ourStory: "Notre histoire",
    eventSchedule: "Programme",
    venue: "Lieu",
    gallery: "Galerie",
    rsvp: "RSVP",
    wedLoveToHearFromYou: "Nous serions ravis d'avoir votre réponse",
    countrysideCelebration: "Une célébration à la campagne",
    rusticCelebration: "Une célébration rustique",
    areTyingTheKnot: "vont se marier",
    thePlan: "Le programme",
    theVenue: "Le lieu",
    wedLoveToHaveYouThere: "Nous serions ravis de vous avoir avec nous",
    giftRegistry: "Liste de cadeaux",
    accommodation: "Hébergement",
    groupCode: "Code de groupe",
    book: "Réserver",
    addToCalendar: "Ajouter au calendrier",
    googleCalendar: "Google Calendar",
    appleOutlook: "Apple / Outlook (.ics)",
    directions: "Itinéraire",
    watchOurStory: "Voir notre histoire",
    thankYou: "Merci",
    thankYouMessageFallback: "Merci d'avoir célébré avec nous.",
    visitShyara: "Visiter Shyara",
    poweredBy: "Powered by",
    invitationRemovedTitle: "Cette invitation n'est plus disponible",
    invitationRemovedDescription: "L'hôte a retiré cette invitation. Si vous pensez qu'il s'agit d'une erreur, contactez directement l'organisateur.",
    invitationMissingTitle: "Invitation introuvable",
    invitationMissingDescription: "Ce lien peut être incorrect, non publié, supprimé ou indisponible. Contactez l'hôte si vous attendiez une invitation active.",
    templateUnavailableTitle: "Modèle indisponible",
    templateUnavailableDescription: "L'invitation existe, mais son modèle n'est pas disponible pour le moment. Contactez l'hôte pour obtenir de l'aide.",
  },
  de: {
    language: "Sprache",
    yourInvited: "Du bist eingeladen",
    openInvitation: "Einladung öffnen",
    skipIntro: "Intro überspringen",
    togetherWithFamilies: "Gemeinsam mit ihren Familien",
    inviteYouToCelebrate: "laden euch ein, ihre",
    categoryLabels: {
      wedding: "Hochzeit",
      engagement: "Verlobung",
      birthday: "Geburtstagsfeier",
      "baby-shower": "Baby Shower",
      corporate: "Veranstaltung",
      anniversary: "Jubiläum",
    },
    ourStory: "Unsere Geschichte",
    eventSchedule: "Ablauf",
    venue: "Ort",
    gallery: "Galerie",
    rsvp: "RSVP",
    wedLoveToHearFromYou: "Wir freuen uns auf deine Rückmeldung",
    countrysideCelebration: "Eine Feier auf dem Land",
    rusticCelebration: "Eine rustikale Feier",
    areTyingTheKnot: "heiraten",
    thePlan: "Der Ablauf",
    theVenue: "Die Location",
    wedLoveToHaveYouThere: "Wir würden uns freuen, dich dabei zu haben",
    giftRegistry: "Geschenkeliste",
    accommodation: "Unterkunft",
    groupCode: "Gruppencode",
    book: "Buchen",
    addToCalendar: "Zum Kalender hinzufügen",
    googleCalendar: "Google Calendar",
    appleOutlook: "Apple / Outlook (.ics)",
    directions: "Route",
    watchOurStory: "Unsere Geschichte ansehen",
    thankYou: "Danke",
    thankYouMessageFallback: "Danke, dass du mit uns gefeiert hast.",
    visitShyara: "Shyara besuchen",
    poweredBy: "Powered by",
    invitationRemovedTitle: "Diese Einladung ist nicht mehr verfügbar",
    invitationRemovedDescription: "Der Gastgeber hat diese Einladung entfernt. Wenn du glaubst, dass das ein Fehler ist, kontaktiere bitte direkt den Veranstalter.",
    invitationMissingTitle: "Einladung nicht gefunden",
    invitationMissingDescription: "Dieser Link könnte falsch, unveröffentlicht, entfernt oder nicht mehr verfügbar sein. Bitte kontaktiere den Gastgeber, wenn du eine aktive Einladung erwartet hast.",
    templateUnavailableTitle: "Vorlage nicht verfügbar",
    templateUnavailableDescription: "Die Einladung existiert, aber ihre Vorlage ist derzeit nicht verfügbar. Bitte kontaktiere den Gastgeber für Hilfe.",
  },
  it: {
    language: "Lingua",
    yourInvited: "Sei invitato",
    openInvitation: "Apri invito",
    skipIntro: "Salta introduzione",
    togetherWithFamilies: "Insieme alle loro famiglie",
    inviteYouToCelebrate: "ti invitano a celebrare il loro",
    categoryLabels: {
      wedding: "matrimonio",
      engagement: "fidanzamento",
      birthday: "compleanno",
      "baby-shower": "baby shower",
      corporate: "evento",
      anniversary: "anniversario",
    },
    ourStory: "La nostra storia",
    eventSchedule: "Programma",
    venue: "Location",
    gallery: "Galleria",
    rsvp: "RSVP",
    wedLoveToHearFromYou: "Ci farebbe piacere ricevere la tua risposta",
    countrysideCelebration: "Una celebrazione in campagna",
    rusticCelebration: "Una celebrazione rustica",
    areTyingTheKnot: "si sposano",
    thePlan: "Il programma",
    theVenue: "La location",
    wedLoveToHaveYouThere: "Ci farebbe piacere averti con noi",
    giftRegistry: "Lista regali",
    accommodation: "Alloggio",
    groupCode: "Codice gruppo",
    book: "Prenota",
    addToCalendar: "Aggiungi al calendario",
    googleCalendar: "Google Calendar",
    appleOutlook: "Apple / Outlook (.ics)",
    directions: "Indicazioni",
    watchOurStory: "Guarda la nostra storia",
    thankYou: "Grazie",
    thankYouMessageFallback: "Grazie per aver festeggiato con noi.",
    visitShyara: "Visita Shyara",
    poweredBy: "Powered by",
    invitationRemovedTitle: "Questo invito non è più disponibile",
    invitationRemovedDescription: "L'organizzatore ha rimosso questo invito. Se pensi che sia un errore, contatta direttamente l'organizzatore dell'evento.",
    invitationMissingTitle: "Invito non trovato",
    invitationMissingDescription: "Questo link potrebbe essere errato, non pubblicato, rimosso o non più disponibile. Contatta l'organizzatore se ti aspettavi di vedere un invito attivo.",
    templateUnavailableTitle: "Template non disponibile",
    templateUnavailableDescription: "L'invito esiste, ma il suo template non è disponibile in questo momento. Contatta l'organizzatore per assistenza.",
  },
};

export const getLiveInviteCopy = (language?: string): LiveInviteCopy => {
  if (!language) {
    return liveInviteCopy.en;
  }

  return liveInviteCopy[language as GuestLanguage] ?? liveInviteCopy.en;
};
