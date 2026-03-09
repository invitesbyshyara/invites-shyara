import { useState, useRef, useEffect } from 'react';

interface AddToCalendarProps {
  title: string;
  /** ISO 8601 date-time string, e.g. "2026-06-15T16:00:00" */
  startDate: string;
  /** ISO 8601 date-time string — defaults to startDate + 3 hours */
  endDate?: string;
  location?: string;
  description?: string;
}

function toICSDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function buildICS(props: Required<Omit<AddToCalendarProps, 'endDate'>> & { endDate: string }): string {
  const { title, startDate, endDate, location, description } = props;
  const escape = (s: string) => s.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shyara//Digital Invitations//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@shyara`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(startDate)}`,
    `DTEND:${toICSDate(endDate)}`,
    `SUMMARY:${escape(title)}`,
    location ? `LOCATION:${escape(location)}` : '',
    description ? `DESCRIPTION:${escape(description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

function addHours(iso: string, hours: number): string {
  const d = new Date(iso);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function buildGoogleUrl(props: AddToCalendarProps): string {
  const start = toICSDate(props.startDate);
  const end = toICSDate(props.endDate ?? addHours(props.startDate, 3));
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: props.title,
    dates: `${start}/${end}`,
    ...(props.location ? { location: props.location } : {}),
    ...(props.description ? { details: props.description } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadICS(props: AddToCalendarProps) {
  const endDate = props.endDate ?? addHours(props.startDate, 3);
  const ics = buildICS({ ...props, endDate, location: props.location ?? '', description: props.description ?? '' });
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${props.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const AddToCalendar = (props: AddToCalendarProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-sm font-body transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span>📅</span>
        <span>Add to Calendar</span>
        <span className="text-xs opacity-60">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-52 rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
        >
          <a
            href={buildGoogleUrl(props)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 text-sm font-body hover:bg-muted transition-colors"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <span>🗓️</span> Google Calendar
          </a>
          <button
            onClick={() => { downloadICS(props); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body hover:bg-muted transition-colors text-left"
            role="menuitem"
          >
            <span>🍎</span> Apple / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
};

export default AddToCalendar;

