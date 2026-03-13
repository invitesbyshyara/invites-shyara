import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Invite, Rsvp } from "@/types";
import { getInviteHeadline } from "@/utils/invite";

const RsvpManagement = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterResponse, setFilterResponse] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!inviteId) return;

    Promise.all([api.getInvite(inviteId), api.getRsvps(inviteId)])
      .then(([inviteResult, rsvpResult]) => {
        setInvite(inviteResult);
        setRsvps(rsvpResult);
      })
      .finally(() => setLoading(false));
  }, [inviteId, isAuthenticated, navigate]);

  const filtered = useMemo(() => rsvps.filter((rsvp) => {
    if (filterResponse !== "all" && rsvp.response !== filterResponse) return false;
    if (search && !rsvp.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [filterResponse, rsvps, search]);

  const stats = {
    total: rsvps.length,
    yes: rsvps.filter((rsvp) => rsvp.response === "yes").length,
    no: rsvps.filter((rsvp) => rsvp.response === "no").length,
    maybe: rsvps.filter((rsvp) => rsvp.response === "maybe").length,
    totalGuests: rsvps.filter((rsvp) => rsvp.response === "yes").reduce((sum, rsvp) => sum + rsvp.guestCount, 0),
  };

  const handleExport = () => {
    const csv = [
      "Name,Response,Guests,Message,Date",
      ...rsvps.map((rsvp) => `"${rsvp.name}","${rsvp.response}",${rsvp.guestCount},"${rsvp.message}","${new Date(rsvp.submittedAt).toLocaleDateString()}"`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rsvps-${inviteId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
          <Link to="/dashboard" className="text-sm text-muted-foreground font-body hover:text-foreground">Back to Dashboard</Link>
        </div>
      </nav>

      <div className="container py-10 px-4 max-w-5xl space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{invite ? getInviteHeadline(invite) : "RSVP Responses"}</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">
              Review guest responses, messages, and headcount in one place.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline"><Link to={`/dashboard/invites/${inviteId}/operations`}>Open Operations</Link></Button>
            {invite?.slug && <Button asChild variant="outline"><Link to={`/i/${invite.slug}`} target="_blank">Open Live Invite</Link></Button>}
            <Button variant="outline" onClick={handleExport}>Export CSV</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Attending", value: stats.yes, color: "text-gold" },
            { label: "Not Attending", value: stats.no, color: "text-destructive" },
            { label: "Maybe", value: stats.maybe, color: "text-muted-foreground" },
            { label: "Guests", value: stats.totalGuests, color: "text-gold" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl border border-border bg-card text-center">
              <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="Search by guest name..." value={search} onChange={(event) => setSearch(event.target.value)} className="flex-1 text-sm" />
            <div className="flex gap-2 flex-wrap">
              {["all", "yes", "no", "maybe"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterResponse(filter)}
                  className={`px-3 py-2 rounded-lg text-xs font-body capitalize transition-colors ${filterResponse === filter ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
                >
                  {filter === "all" ? "All" : filter}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-body">Filter responses and scan guest messages quickly, especially from mobile.</p>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-border bg-card">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="font-display text-xl font-semibold mb-2">{rsvps.length === 0 ? "No RSVPs yet" : "No matching results"}</h3>
            <p className="text-muted-foreground font-body text-sm">{rsvps.length === 0 ? "Share your invite link to start receiving responses." : "Try a different search or filter."}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:hidden">
              {filtered.map((rsvp) => (
                <div key={rsvp.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-semibold">{rsvp.name}</h3>
                      <p className="text-xs text-muted-foreground font-body mt-1">{new Date(rsvp.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-body font-medium capitalize ${rsvp.response === "yes" ? "bg-accent text-accent-foreground" : rsvp.response === "no" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
                      {rsvp.response === "yes" ? "Attending" : rsvp.response === "no" ? "Not Attending" : "Maybe"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-body mt-3">Guests: {rsvp.guestCount}</p>
                  {rsvp.message && <p className="text-sm font-body mt-3">{rsvp.message}</p>}
                </div>
              ))}
            </div>

            <div className="hidden md:block rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-3 text-xs font-body font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-body font-medium text-muted-foreground">Response</th>
                      <th className="text-left px-4 py-3 text-xs font-body font-medium text-muted-foreground">Guests</th>
                      <th className="text-left px-4 py-3 text-xs font-body font-medium text-muted-foreground">Message</th>
                      <th className="text-left px-4 py-3 text-xs font-body font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rsvp) => (
                      <tr key={rsvp.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-body font-medium">{rsvp.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-body font-medium capitalize ${rsvp.response === "yes" ? "bg-accent text-accent-foreground" : rsvp.response === "no" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
                            {rsvp.response === "yes" ? "Attending" : rsvp.response === "no" ? "Not Attending" : "Maybe"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-body text-muted-foreground">{rsvp.guestCount}</td>
                        <td className="px-4 py-3 text-sm font-body text-muted-foreground max-w-[240px] truncate">{rsvp.message}</td>
                        <td className="px-4 py-3 text-xs font-body text-muted-foreground">{new Date(rsvp.submittedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RsvpManagement;
