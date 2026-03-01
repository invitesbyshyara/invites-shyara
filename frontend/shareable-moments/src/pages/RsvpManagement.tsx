import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Rsvp } from '@/types';

const RsvpManagement = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const { isAuthenticated } = useAuth();
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterResponse, setFilterResponse] = useState<string>('all');

  useEffect(() => {
    if (!inviteId) return;
    api.getRsvps(inviteId).then(setRsvps).finally(() => setLoading(false));
  }, [inviteId]);

  const filtered = rsvps.filter(r => {
    if (filterResponse !== 'all' && r.response !== filterResponse) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: rsvps.length,
    yes: rsvps.filter(r => r.response === 'yes').length,
    no: rsvps.filter(r => r.response === 'no').length,
    maybe: rsvps.filter(r => r.response === 'maybe').length,
    totalGuests: rsvps.filter(r => r.response === 'yes').reduce((s, r) => s + r.guestCount, 0),
  };

  const handleExport = () => {
    const csv = [
      'Name,Response,Guests,Message,Date',
      ...rsvps.map(r =>
        `"${r.name}","${r.response}",${r.guestCount},"${r.message}","${new Date(r.submittedAt).toLocaleDateString()}"`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsvps-${inviteId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
          <Link to="/dashboard" className="text-sm text-muted-foreground font-body hover:text-foreground">← Dashboard</Link>
        </div>
      </nav>

      <div className="container py-10 px-4 max-w-4xl">
        <h1 className="font-display text-3xl font-bold mb-8">RSVP Responses</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Attending', value: stats.yes, color: 'text-gold' },
            { label: 'Not Attending', value: stats.no, color: 'text-destructive' },
            { label: 'Maybe', value: stats.maybe, color: 'text-muted-foreground' },
            { label: 'Total Guests', value: stats.totalGuests, color: 'text-gold' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl border border-border bg-card text-center">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm"
          />
          <div className="flex gap-2">
            {['all', 'yes', 'no', 'maybe'].map(f => (
              <button
                key={f}
                onClick={() => setFilterResponse(f)}
                className={`px-3 py-2 rounded-lg text-xs font-body capitalize transition-colors ${
                  filterResponse === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="font-body text-xs">
            Export CSV
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-border bg-card">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="font-display text-xl font-semibold mb-2">
              {rsvps.length === 0 ? 'No RSVPs yet' : 'No matching results'}
            </h3>
            <p className="text-muted-foreground font-body text-sm">
              {rsvps.length === 0
                ? 'Share your invite link to start receiving responses'
                : 'Try adjusting your search or filter'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-body font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-body font-medium text-muted-foreground">Response</th>
                    <th className="text-left px-4 py-3 text-xs font-body font-medium text-muted-foreground">Guests</th>
                    <th className="text-left px-4 py-3 text-xs font-body font-medium text-muted-foreground hidden md:table-cell">Message</th>
                    <th className="text-left px-4 py-3 text-xs font-body font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-body font-medium">{r.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-body font-medium capitalize ${
                          r.response === 'yes' ? 'bg-accent text-accent-foreground' :
                          r.response === 'no' ? 'bg-destructive/10 text-destructive' :
                          'bg-secondary text-secondary-foreground'
                        }`}>
                          {r.response === 'yes' ? 'Attending' : r.response === 'no' ? 'Not Attending' : 'Maybe'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-body text-muted-foreground">{r.guestCount}</td>
                      <td className="px-4 py-3 text-sm font-body text-muted-foreground max-w-[200px] truncate hidden md:table-cell">{r.message}</td>
                      <td className="px-4 py-3 text-xs font-body text-muted-foreground hidden sm:table-cell">
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RsvpManagement;
