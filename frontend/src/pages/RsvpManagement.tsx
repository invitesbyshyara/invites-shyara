import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Invite, InviteWorkspace, Rsvp } from "@/types";
import { getInviteHeadline } from "@/utils/invite";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const RsvpManagement = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [workspace, setWorkspace] = useState<InviteWorkspace | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterResponse, setFilterResponse] = useState("all");
  const [requestingAccess, setRequestingAccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!inviteId) return;

    api.getInviteWorkspace(inviteId)
      .then(async (workspaceResult) => {
        setWorkspace(workspaceResult);

        const canViewResponses = workspaceResult.accessRole === "owner" ||
          workspaceResult.permissions.some((permission) =>
            ["manage_rsvps", "handle_guest_support", "view_reports", "edit_content"].includes(permission)
          );

        if (canViewResponses) {
          if (workspaceResult.accessRole === "owner" || workspaceResult.permissions.includes("edit_content")) {
            const inviteResult = await api.getInvite(inviteId);
            setInvite(inviteResult);
          }
          const rsvpResult = await api.getRsvps(inviteId);
          setRsvps(rsvpResult);
        }
      })
      .finally(() => setLoading(false));
  }, [inviteId, isAuthenticated, navigate]);

  const requestAccess = async () => {
    if (!inviteId) return;
    const requestedPermissions = ["manage_rsvps", "view_reports", "handle_guest_support", "edit_content"].filter((permission) =>
      workspace?.requestablePermissions.includes(permission as typeof workspace.requestablePermissions[number])
    ) as Array<"manage_rsvps" | "view_reports" | "handle_guest_support" | "edit_content">;
    setRequestingAccess(true);
    try {
      await api.requestInviteAccess(inviteId, requestedPermissions);
      const refreshedWorkspace = await api.getInviteWorkspace(inviteId);
      setWorkspace(refreshedWorkspace);
      toast({ title: "Access request sent" });
    } catch {
      toast({ title: "Could not request access", variant: "destructive" });
    } finally {
      setRequestingAccess(false);
    }
  };

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

  const inviteHeadline = invite ? getInviteHeadline(invite) : workspace?.invite.slug ?? "";

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    ...(invite ? [{ label: inviteHeadline, href: `/dashboard/invites/${inviteId}/operations` }] : []),
    { label: "Responses" },
  ];

  // Stat cards — clicking one sets the active filter
  const statCards = [
    { label: "Total", value: stats.total, color: "text-foreground", filter: "all" },
    { label: "Attending", value: stats.yes, color: "text-emerald-600 dark:text-emerald-400", filter: "yes" },
    { label: "Not Attending", value: stats.no, color: "text-destructive", filter: "no" },
    { label: "Maybe", value: stats.maybe, color: "text-muted-foreground", filter: "maybe" },
    { label: "Total Guests", value: stats.totalGuests, color: "text-foreground", filter: "yes" },
  ];

  const canViewResponses = workspace?.accessRole === "owner" ||
    workspace?.permissions.some((permission) => ["manage_rsvps", "handle_guest_support", "view_reports", "edit_content"].includes(permission));
  const pendingRequest = workspace?.myAccessRequests.find((request) =>
    request.status === "pending" && request.requestedPermissions.includes("manage_rsvps")
  );

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      actions={
        <div className="flex items-center gap-2">
          {(invite?.slug || workspace?.invite.slug) && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/i/${invite?.slug || workspace?.invite.slug}`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Live Invite
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      }
    >
      {!loading && !canViewResponses ? (
        <div className="container py-10 px-4 max-w-3xl">
          <div className="rounded-2xl border border-border bg-card p-8 space-y-5">
            <div>
              <h1 className="font-display text-3xl font-bold">RSVP access required</h1>
              <p className="text-sm text-muted-foreground mt-2">
                This workspace is available to you, but the RSVP list is limited to collaborators with guest-management or reporting access.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">manage rsvps</Badge>
              <Badge variant="outline">view reports</Badge>
              <Badge variant="outline">handle guest support</Badge>
            </div>
            {pendingRequest ? (
              <p className="text-sm text-muted-foreground">Request pending since {new Date(pendingRequest.requestedAt).toLocaleDateString()}.</p>
            ) : (
              <Button
                disabled={requestingAccess || !workspace?.requestablePermissions.some((permission) => ["manage_rsvps", "view_reports", "handle_guest_support", "edit_content"].includes(permission))}
                onClick={requestAccess}
              >
                {requestingAccess ? "Requesting..." : "Request access from Admin"}
              </Button>
            )}
          </div>
        </div>
      ) : (
      <div className="container py-10 px-4 max-w-5xl space-y-8">
        {/* Page heading */}
        <div>
          <h1 className="font-display text-3xl font-bold">
            {invite ? `${inviteHeadline} — Responses` : "RSVP Responses"}
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Review guest responses, messages, and headcount in one place.
          </p>
        </div>

        {/* Stat cards — clickable to filter */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              onClick={() => setFilterResponse(stat.filter)}
              className={`p-4 rounded-xl border bg-card text-center transition-all cursor-pointer ${
                filterResponse === stat.filter
                  ? "border-primary/60 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{stat.label}</p>
            </button>
          ))}
        </div>

        {/* Search + filter row */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by guest name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1 text-sm"
            />
            <div className="flex gap-2 flex-wrap">
              {[
                { filter: "all", label: "All" },
                { filter: "yes", label: "Attending" },
                { filter: "no", label: "Not Attending" },
                { filter: "maybe", label: "Maybe" },
              ].map(({ filter, label }) => (
                <button
                  key={filter}
                  onClick={() => setFilterResponse(filter)}
                  className={`px-3 py-2 rounded-lg text-xs font-body transition-colors ${
                    filterResponse === filter
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-border bg-card">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="font-display text-xl font-semibold mb-2">
              {rsvps.length === 0 ? "No responses yet" : "No matching results"}
            </h3>
            <p className="text-muted-foreground font-body text-sm">
              {rsvps.length === 0
                ? "Share your invite link to start receiving responses."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="grid gap-4 md:hidden">
              {filtered.map((rsvp) => (
                <div key={rsvp.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-semibold">{rsvp.name}</h3>
                      <p className="text-xs text-muted-foreground font-body mt-1">
                        {new Date(rsvp.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-body font-medium capitalize ${
                      rsvp.response === "yes"
                        ? "bg-accent text-accent-foreground"
                        : rsvp.response === "no"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-secondary text-secondary-foreground"
                    }`}>
                      {rsvp.response === "yes" ? "Attending" : rsvp.response === "no" ? "Not Attending" : "Maybe"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-body mt-3">
                    {rsvp.guestCount} {rsvp.guestCount === 1 ? "guest" : "guests"}
                  </p>
                  {rsvp.message && (
                    <p className="text-sm font-body mt-3 border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground">
                      {rsvp.message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: table layout */}
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
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-body font-medium capitalize ${
                            rsvp.response === "yes"
                              ? "bg-accent text-accent-foreground"
                              : rsvp.response === "no"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-secondary text-secondary-foreground"
                          }`}>
                            {rsvp.response === "yes" ? "Attending" : rsvp.response === "no" ? "Not Attending" : "Maybe"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-body text-muted-foreground">{rsvp.guestCount}</td>
                        <td className="px-4 py-3 text-sm font-body text-muted-foreground max-w-[240px]">
                          {rsvp.message ? (
                            <span className="border-l-2 border-muted-foreground/30 pl-3 block truncate">
                              {rsvp.message}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-body text-muted-foreground">
                          {new Date(rsvp.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </DashboardLayout>
  );
};

export default RsvpManagement;
