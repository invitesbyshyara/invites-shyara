import { TemplateField } from '@/types';

export const weddingFields: TemplateField[] = [
  { key: 'brideName', label: "Bride's Name", type: 'text', required: true, section: 'basic', maxLength: 50 },
  { key: 'groomName', label: "Groom's Name", type: 'text', required: true, section: 'basic', maxLength: 50 },
  { key: 'weddingDate', label: 'Wedding Date', type: 'date', required: true, section: 'basic' },
  { key: 'weddingTime', label: 'Wedding Time', type: 'time', required: true, section: 'basic' },
  { key: 'venueName', label: 'Venue Name', type: 'text', required: true, section: 'venue' },
  { key: 'venueAddress', label: 'Venue Address', type: 'textarea', required: true, section: 'venue' },
  { key: 'loveStory', label: 'Your Love Story', type: 'textarea', required: false, section: 'story' },
  { key: 'coverPhoto', label: 'Cover Photo', type: 'image', required: false, section: 'gallery' },
  { key: 'galleryPhotos', label: 'Gallery Photos', type: 'images', required: false, section: 'gallery', max: 10 },
  { key: 'schedule', label: 'Event Schedule', type: 'schedule-list', required: false, section: 'schedule' },
  { key: 'rsvpDeadline', label: 'RSVP Deadline', type: 'date', required: false, section: 'rsvp' },
  { key: 'enableMusic', label: 'Background Music', type: 'toggle', required: false, section: 'settings' },
];

export const engagementFields: TemplateField[] = [
  { key: 'partnerOneName', label: 'Partner One Name', type: 'text', required: true, section: 'basic', maxLength: 50 },
  { key: 'partnerTwoName', label: 'Partner Two Name', type: 'text', required: true, section: 'basic', maxLength: 50 },
  { key: 'engagementDate', label: 'Engagement Date', type: 'date', required: true, section: 'basic' },
  { key: 'engagementTime', label: 'Engagement Time', type: 'time', required: true, section: 'basic' },
  { key: 'venueName', label: 'Venue Name', type: 'text', required: true, section: 'venue' },
  { key: 'venueAddress', label: 'Venue Address', type: 'textarea', required: true, section: 'venue' },
  { key: 'ourStory', label: 'Our Story', type: 'textarea', required: false, section: 'story' },
  { key: 'coverPhoto', label: 'Cover Photo', type: 'image', required: false, section: 'gallery' },
  { key: 'galleryPhotos', label: 'Gallery Photos', type: 'images', required: false, section: 'gallery', max: 10 },
  { key: 'schedule', label: 'Event Schedule', type: 'schedule-list', required: false, section: 'schedule' },
  { key: 'rsvpDeadline', label: 'RSVP Deadline', type: 'date', required: false, section: 'rsvp' },
  { key: 'enableMusic', label: 'Background Music', type: 'toggle', required: false, section: 'settings' },
];

export const birthdayFields: TemplateField[] = [
  { key: 'celebrantName', label: 'Celebrant Name', type: 'text', required: true, section: 'basic', maxLength: 50 },
  { key: 'age', label: 'Turning Age', type: 'number', required: false, section: 'basic' },
  { key: 'eventDate', label: 'Event Date', type: 'date', required: true, section: 'basic' },
  { key: 'eventTime', label: 'Event Time', type: 'time', required: true, section: 'basic' },
  { key: 'venueName', label: 'Venue Name', type: 'text', required: true, section: 'venue' },
  { key: 'venueAddress', label: 'Venue Address', type: 'textarea', required: true, section: 'venue' },
  { key: 'welcomeMessage', label: 'Welcome Message', type: 'textarea', required: false, section: 'story' },
  { key: 'coverPhoto', label: 'Cover Photo', type: 'image', required: false, section: 'gallery' },
  { key: 'galleryPhotos', label: 'Gallery Photos', type: 'images', required: false, section: 'gallery', max: 10 },
  { key: 'schedule', label: 'Event Schedule', type: 'schedule-list', required: false, section: 'schedule' },
  { key: 'rsvpDeadline', label: 'RSVP Deadline', type: 'date', required: false, section: 'rsvp' },
];

export const babyShowerFields: TemplateField[] = [
  { key: 'parentNames', label: 'Parent Names', type: 'text', required: true, section: 'basic', maxLength: 80 },
  { key: 'babyName', label: 'Baby Name (if decided)', type: 'text', required: false, section: 'basic', maxLength: 50 },
  { key: 'eventDate', label: 'Event Date', type: 'date', required: true, section: 'basic' },
  { key: 'eventTime', label: 'Event Time', type: 'time', required: true, section: 'basic' },
  { key: 'venueName', label: 'Venue Name', type: 'text', required: true, section: 'venue' },
  { key: 'venueAddress', label: 'Venue Address', type: 'textarea', required: true, section: 'venue' },
  { key: 'welcomeMessage', label: 'Welcome Message', type: 'textarea', required: false, section: 'story' },
  { key: 'theme', label: 'Theme', type: 'text', required: false, section: 'basic' },
  { key: 'coverPhoto', label: 'Cover Photo', type: 'image', required: false, section: 'gallery' },
  { key: 'galleryPhotos', label: 'Gallery Photos', type: 'images', required: false, section: 'gallery', max: 10 },
  { key: 'registryLink', label: 'Gift Registry Link', type: 'url', required: false, section: 'settings' },
  { key: 'rsvpDeadline', label: 'RSVP Deadline', type: 'date', required: false, section: 'rsvp' },
];

export const corporateFields: TemplateField[] = [
  { key: 'eventName', label: 'Event Name', type: 'text', required: true, section: 'basic', maxLength: 100 },
  { key: 'organizerName', label: 'Organizer Name', type: 'text', required: true, section: 'basic', maxLength: 80 },
  { key: 'companyName', label: 'Company Name', type: 'text', required: false, section: 'basic', maxLength: 80 },
  { key: 'eventDate', label: 'Event Date', type: 'date', required: true, section: 'basic' },
  { key: 'eventTime', label: 'Event Time', type: 'time', required: true, section: 'basic' },
  { key: 'venueName', label: 'Venue Name', type: 'text', required: true, section: 'venue' },
  { key: 'venueAddress', label: 'Venue Address', type: 'textarea', required: true, section: 'venue' },
  { key: 'description', label: 'Event Description', type: 'textarea', required: false, section: 'story' },
  { key: 'coverPhoto', label: 'Cover Photo', type: 'image', required: false, section: 'gallery' },
  { key: 'schedule', label: 'Agenda', type: 'schedule-list', required: false, section: 'schedule' },
  { key: 'rsvpDeadline', label: 'RSVP Deadline', type: 'date', required: false, section: 'rsvp' },
];

export const anniversaryFields: TemplateField[] = [
  { key: 'coupleNames', label: 'Couple Names', type: 'text', required: true, section: 'basic', maxLength: 80 },
  { key: 'years', label: 'Years Together', type: 'number', required: false, section: 'basic' },
  { key: 'anniversaryDate', label: 'Anniversary Date', type: 'date', required: true, section: 'basic' },
  { key: 'anniversaryTime', label: 'Event Time', type: 'time', required: true, section: 'basic' },
  { key: 'venueName', label: 'Venue Name', type: 'text', required: true, section: 'venue' },
  { key: 'venueAddress', label: 'Venue Address', type: 'textarea', required: true, section: 'venue' },
  { key: 'ourJourney', label: 'Our Journey', type: 'textarea', required: false, section: 'story' },
  { key: 'coverPhoto', label: 'Cover Photo', type: 'image', required: false, section: 'gallery' },
  { key: 'galleryPhotos', label: 'Gallery Photos', type: 'images', required: false, section: 'gallery', max: 10 },
  { key: 'schedule', label: 'Event Schedule', type: 'schedule-list', required: false, section: 'schedule' },
  { key: 'rsvpDeadline', label: 'RSVP Deadline', type: 'date', required: false, section: 'rsvp' },
  { key: 'enableMusic', label: 'Background Music', type: 'toggle', required: false, section: 'settings' },
];
