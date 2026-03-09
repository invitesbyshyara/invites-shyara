import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface InviteRsvpFormProps {
  inviteId: string;
  accentColor?: string;
  className?: string;
}

const inputCls = 'w-full px-4 py-3 border border-border rounded-xl bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring';

const InviteRsvpForm = ({ inviteId, accentColor, className = '' }: InviteRsvpFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [response, setResponse] = useState<'yes' | 'no' | 'maybe'>('yes');
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState('');
  const [mealPreference, setMealPreference] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  const [mealOptions, setMealOptions] = useState<string[]>([]);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    api.getRsvpConfig(inviteId)
      .then(cfg => {
        setMealOptions(cfg.mealOptions ?? []);
        if (cfg.rsvpDeadline && new Date(cfg.rsvpDeadline) < new Date()) {
          setDeadlinePassed(true);
        }
      })
      .catch(() => {/* non-critical */});
  }, [inviteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.submitRsvp(inviteId, {
        name: name.trim(),
        email: email.trim() || undefined,
        response,
        guestCount,
        message: message.trim(),
        mealPreference: mealPreference || undefined,
        dietaryRestrictions: dietaryRestrictions.trim() || undefined,
        _hp: '',
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e.status === 410) {
        setDeadlinePassed(true);
      } else {
        setSubmitError(e.message ?? "Could not send RSVP. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (deadlinePassed) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-5xl mb-4">🔒</div>
        <h3 className="font-display text-2xl font-bold mb-2">RSVPs Closed</h3>
        <p className="text-muted-foreground font-body text-sm">
          The RSVP deadline for this event has passed. Please contact the organiser directly.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-5xl mb-4">💌</div>
        <h3 className="font-display text-2xl font-bold mb-2">Thank You!</h3>
        <p className="text-muted-foreground font-body text-sm">
          {response === 'yes'
            ? "We're thrilled you'll be joining us!"
            : response === 'maybe'
              ? "We hope you can make it!"
              : "We'll miss you! Thanks for letting us know."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 text-left ${className}`}>
      {/* Honeypot — hidden from humans, filled by bots */}
      <input
        type="text"
        name="_hp"
        value=""
        onChange={() => {}}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
      />

      <input
        type="text"
        placeholder="Your Name *"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        className={inputCls}
      />

      <input
        type="email"
        placeholder="Email address (optional)"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className={inputCls}
      />

      <div className="flex gap-2">
        {(['yes', 'no', 'maybe'] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => setResponse(opt)}
            className={`flex-1 py-3 rounded-xl font-body text-sm font-medium transition-all border ${
              response === opt
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:bg-accent'
            }`}
          >
            {opt === 'yes' ? '✓ Attending' : opt === 'no' ? '✗ Regret' : '? Maybe'}
          </button>
        ))}
      </div>

      {response === 'yes' && (
        <input
          type="number"
          placeholder="Number of guests"
          min={1}
          max={10}
          value={guestCount}
          onChange={e => setGuestCount(Number(e.target.value))}
          className={inputCls}
        />
      )}

      {mealOptions.length > 0 && (
        <select
          value={mealPreference}
          onChange={e => setMealPreference(e.target.value)}
          className={inputCls}
        >
          <option value="">Meal preference (optional)</option>
          {mealOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      <textarea
        placeholder="Leave a message... (optional)"
        rows={3}
        value={message}
        onChange={e => setMessage(e.target.value)}
        className={`${inputCls} resize-none`}
      />

      <textarea
        placeholder="Dietary restrictions or allergies (optional)"
        rows={2}
        value={dietaryRestrictions}
        onChange={e => setDietaryRestrictions(e.target.value)}
        className={`${inputCls} resize-none`}
      />

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-body font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Sending...' : 'Send RSVP'}
      </button>
      {submitError && (
        <p className="text-xs text-destructive font-body text-center">{submitError}</p>
      )}
    </form>
  );
};

export default InviteRsvpForm;

