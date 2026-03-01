import { useState } from 'react';
import { api } from '@/services/api';

interface InviteRsvpFormProps {
  inviteId: string;
  accentColor?: string;
  className?: string;
}

const InviteRsvpForm = ({ inviteId, accentColor, className = '' }: InviteRsvpFormProps) => {
  const [name, setName] = useState('');
  const [response, setResponse] = useState<'yes' | 'no' | 'maybe'>('yes');
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    // Optimistic: show thank you immediately
    setSubmitted(true);
    try {
      await api.submitRsvp(inviteId, { name: name.trim(), response, guestCount, message: message.trim() });
    } catch {
      // Still show success — optimistic UI
    } finally {
      setSubmitting(false);
    }
  };

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
      <input
        type="text"
        placeholder="Your Name *"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        className="w-full px-4 py-3 border border-border rounded-xl bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
          className="w-full px-4 py-3 border border-border rounded-xl bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
      <textarea
        placeholder="Leave a message... (optional)"
        rows={3}
        value={message}
        onChange={e => setMessage(e.target.value)}
        className="w-full px-4 py-3 border border-border rounded-xl bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-body font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Sending...' : 'Send RSVP'}
      </button>
    </form>
  );
};

export default InviteRsvpForm;
