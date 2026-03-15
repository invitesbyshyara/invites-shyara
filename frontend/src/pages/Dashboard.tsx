import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Check, ChevronRight, Copy, ExternalLink, MoreHorizontal, Plus, Search, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, apiUrl as apiBaseUrl } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Invite } from "@/types";
import ShareMenu from "@/components/ShareMenu";
import QRCodeCard from "@/components/QRCodeCard";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import { getTemplateBySlug } from "@/templates/registry";
import { buildShareMessage } from "@/utils/share";
import { getEventDateFromData, getInviteHeadline } from "@/utils/invite";
import { getPackageDisplayName } from "@/lib/packageCatalog";

const statusBorderColor: Record<string, string> = {
  published: "border-l-4 border-l-emerald-500",
  draft: "border-l-4 border-l-amber-400",
  expired: "border-l-4 border-l-slate-400",
  "taken-down": "border-l-4 border-l-destructive",
};

const statusStyles: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  expired: "bg-muted text-muted-foreground",
  "taken-down": "bg-destructive/10 text-destructive",
};

const STATUS_TABS = [
  { value: "all", label: "All Invites" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "expired", label: "Expired" },
];

const Dashboard = () => {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareInviteId, setShareInviteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    api.getInvites().then(setInvites).finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, navigate]);

  const filteredInvites = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = invites.filter((invite) => {
      if (statusFilter !== "all" && invite.status !== statusFilter) return false;
      if (!query) return true;

      const title = getInviteHeadline(invite).toLowerCase();
      const templateName = invite.templateSlug.replace(/-/g, " ");
      return title.includes(query) || templateName.includes(query) || invite.slug?.toLowerCase().includes(query);
    });

    const sorted = [...result];
    sorted.sort((a, b) => {
      if (sortBy === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "name") return getInviteHeadline(a).localeCompare(getInviteHeadline(b));
      return b.rsvpCount - a.rsvpCount;
    });

    return sorted;
  }, [invites, search, statusFilter, sortBy]);

  const totalRsvps = invites.reduce((sum, invite) => sum + invite.rsvpCount, 0);
  const publishedInvites = invites.filter((invite) => invite.status === "published").length;
  const drafts = invites.filter((invite) => invite.status === "draft").length;
  const canEditInvite = (invite: Invite) => invite.accessRole === "owner" || Boolean(invite.permissions?.includes("edit_content"));
  const canViewResponsesForInvite = (invite: Invite) =>
    invite.accessRole === "owner" ||
    Boolean(invite.permissions?.some((permission) => ["manage_rsvps", "handle_guest_support", "view_reports", "edit_content"].includes(permission)));
  const canDeleteInvite = (invite: Invite) => invite.accessRole === "owner" || (!invite.accessRole && invite.userId === user?.id);
  const isInviteActive = (invite: Invite) => !invite.canRenew && invite.status !== "taken-down";
  const canUseEventManagement = (invite: Invite) => isInviteActive(invite) && invite.eventManagementEnabled;
  const openRenewalCheckout = (invite: Invite) => navigate(`/checkout/${invite.templateSlug}?intent=renewal&inviteId=${invite.id}`);
  const openAddonCheckout = (invite: Invite) => navigate(`/checkout/${invite.templateSlug}?intent=event_management_addon&inviteId=${invite.id}`);

  const checklist = [
    { label: "Pick a template", complete: invites.length > 0 },
    { label: "Fill in your details", complete: drafts > 0 || publishedInvites > 0 },
    { label: "Go live", complete: publishedInvites > 0 },
    { label: "Share with your guests", complete: totalRsvps > 0 },
  ];
  const allChecklistComplete = checklist.every((item) => item.complete);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteInvite(deleteId);
      setInvites((current) => current.filter((invite) => invite.id !== deleteId));
      toast({ title: "Invite deleted", description: "The invitation has been permanently removed." });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleteId(null);
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleCopySlug = (slug: string) => {
    void navigator.clipboard.writeText(`${window.location.origin}/i/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const firstPublishedInvite = invites.find((invite) =>
    invite.status === "published" && canViewResponsesForInvite(invite) && canUseEventManagement(invite)
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const statCards = [
    {
      label: "My Invites",
      value: invites.length,
      hint: "All drafts and live invites",
      action: () => setStatusFilter("all"),
      actionLabel: "View all invites",
      disabled: false,
    },
    {
      label: "Live Now",
      value: publishedInvites,
      hint: "Active invite links your guests can open",
      action: () => setStatusFilter("published"),
      actionLabel: "View published",
      disabled: false,
    },
    {
      label: "Responses Received",
      value: totalRsvps,
      hint: firstPublishedInvite ? "Total RSVPs across all invites" : "Publish an invite to start collecting RSVPs",
      action: () => {
        if (firstPublishedInvite) navigate(`/dashboard/invites/${firstPublishedInvite.id}/rsvps`);
      },
      actionLabel: firstPublishedInvite ? "View all responses" : "No responses yet",
      disabled: !firstPublishedInvite,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
          <div className="flex items-center gap-4 text-sm font-body">
            <Link to="/dashboard" className="font-medium text-foreground">Dashboard</Link>
            <Link to="/templates" className="text-muted-foreground hover:text-foreground hidden md:inline">Browse</Link>
            <Link to="/account" className="text-muted-foreground hover:text-foreground hidden md:inline">Account</Link>
            <button onClick={() => void handleLogout()} className="text-muted-foreground hover:text-foreground">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container py-10 px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-bold">Welcome, {user?.name?.split(" ")[0] || "there"}</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">Create, publish, share, and manage your live invite links in one place.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/templates">
              <Plus className="w-4 h-4 mr-2" />
              New Invite
            </Link>
          </Button>
        </div>

        {/* Stats + Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)
              : statCards.map((stat) => (
                <button
                  key={stat.label}
                  onClick={stat.action}
                  disabled={stat.disabled}
                  title={stat.actionLabel}
                  className={`p-6 rounded-xl border border-border bg-card text-left w-full transition-all group ${
                    stat.disabled
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer hover:border-primary/50 hover:ring-2 hover:ring-primary/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-muted-foreground font-body">{stat.label}</p>
                    {!stat.disabled && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary/70 transition-colors shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-3xl font-display font-bold mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-body mt-2">{stat.hint}</p>
                </button>
              ))}
          </div>

          {/* Checklist — only shown until all steps are complete */}
          {!allChecklistComplete && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Getting started</h2>
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center text-xs shrink-0 ${item.complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {item.complete ? <Check className="w-3 h-3" /> : ""}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.complete ? "Done" : "Pending"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters — two rows for clarity */}
        <div className="space-y-3">
          {/* Row 1: Status tabs */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 w-fit">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium font-body transition-all ${
                  statusFilter === tab.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Row 2: Search, sort, result count */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative min-w-[220px] lg:max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by event, slug, or template" className="pl-9" />
              </div>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-body">
                <option value="updated">Last Modified</option>
                <option value="created">Recently Created</option>
                <option value="name">Name</option>
                <option value="rsvps">Most Responses</option>
              </select>
            </div>
            {!loading && (
              <p className="text-xs text-muted-foreground font-body shrink-0">
                Showing {filteredInvites.length} of {invites.length} {invites.length === 1 ? "invite" : "invites"}
              </p>
            )}
          </div>
        </div>

        {/* Invite Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-xl" />)}
          </div>
        ) : filteredInvites.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-border bg-card">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="font-display text-xl font-semibold mb-2">{invites.length === 0 ? "No invites yet" : "No matching invites"}</h3>
            <p className="text-muted-foreground font-body mb-6">
              {invites.length === 0 ? "Start by picking a template and previewing the design you like." : "Try a different search or filter combination."}
            </p>
            <Button asChild size="lg"><Link to="/templates">Browse Templates</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredInvites.map((invite) => {
              const template = getTemplateBySlug(invite.templateSlug);
              const title = getInviteHeadline(invite);
              const eventDate = getEventDateFromData(invite.data ?? {});
              const isDraft = invite.status === "draft";
              const isPublished = invite.status === "published";
              const editPath = `/dashboard/invites/${invite.id}/edit`;
              const validUntilLabel = invite.validUntil
                ? new Date(invite.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "Not set";
              const packageLabel = getPackageDisplayName(invite.packageCode);

              return (
                <div
                  key={invite.id}
                  className={`rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow ${statusBorderColor[invite.status] || statusBorderColor.expired}`}
                >
                  <div className="h-48 bg-muted/40 border-b border-border">
                    {template ? <TemplateThumbnail config={template} /> : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Preview unavailable</div>}
                  </div>

                  <div className="p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-lg truncate">{title}</h3>
                        <p className="text-xs text-muted-foreground font-body mt-0.5 capitalize">
                          {invite.templateSlug.replace(/-/g, " ")} · {packageLabel}
                        </p>
                        {invite.accessRole && invite.accessRole !== "owner" && (
                          <p className="text-xs text-muted-foreground font-body mt-0.5 capitalize">Role: {invite.accessRole}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-body font-medium capitalize ${statusStyles[invite.status] || statusStyles.expired}`}>
                          {invite.status === "published" ? "Live" : invite.status === "taken-down" ? "Taken down" : invite.status}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors" aria-label="More options">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isPublished && invite.slug && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link to={`/i/${invite.slug}`} target="_blank" className="flex items-center">
                                    <ExternalLink className="w-4 h-4 mr-2" /> Open Live Page
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {canDeleteInvite(invite) && (
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(invite.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete invite
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Info row */}
                    <div className="space-y-1.5 text-sm text-muted-foreground font-body mb-4">
                      <p>{eventDate ? `Event: ${new Date(eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "Event date not added yet"}</p>
                      <p>{invite.rsvpCount} {invite.rsvpCount === 1 ? "response" : "responses"} collected</p>
                      <p>Valid until {validUntilLabel}</p>
                      {invite.canRenew && <p className="text-destructive">Renew this invite to restore access.</p>}
                      {invite.canUpgradeEventManagement && <p className="text-primary">Invite is live, but RSVP and event tools are still locked.</p>}
                      {isPublished && invite.slug && (
                        <button
                          onClick={() => handleCopySlug(invite.slug!)}
                          className="flex items-center gap-1.5 text-xs text-primary hover:underline focus:outline-none"
                        >
                          {copiedSlug === invite.slug ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedSlug === invite.slug ? "Copied!" : `/i/${invite.slug}`}
                        </button>
                      )}
                    </div>

                    {/* Action buttons — primary actions visible, secondary in dropdown */}
                    {invite.canRenew ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => openRenewalCheckout(invite)}>
                          Renew Invite
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" disabled>
                          Access locked
                        </Button>
                      </div>
                    ) : isPublished && invite.slug ? (
                      <div className="flex gap-2">
                        {canUseEventManagement(invite) && canViewResponsesForInvite(invite) && (
                          <Button asChild size="sm" className="flex-1">
                            <Link to={`/dashboard/invites/${invite.id}/rsvps`}>View RSVPs</Link>
                          </Button>
                        )}
                        {invite.canUpgradeEventManagement ? (
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => openAddonCheckout(invite)}>
                            Unlock Event Tools
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className={canViewResponsesForInvite(invite) ? "flex-1" : "w-full"}
                            onClick={() => navigate(`/dashboard/invites/${invite.id}/operations`)}
                          >
                            Manage Event
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-2.5"
                          onClick={() => setShareInviteId(invite.id)}
                          aria-label="Share invite"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {canEditInvite(invite) && (
                          <Button asChild size="sm" className="flex-1">
                            <Link to={editPath}>{isDraft ? "Edit Draft" : "Edit Invite"}</Link>
                          </Button>
                        )}
                        {invite.canUpgradeEventManagement ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className={canEditInvite(invite) ? "flex-1" : "w-full"}
                            onClick={() => openAddonCheckout(invite)}
                          >
                            Unlock Event Tools
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className={canEditInvite(invite) ? "flex-1" : "w-full"}
                            onClick={() => navigate(`/dashboard/invites/${invite.id}/operations`)}
                            disabled={!canUseEventManagement(invite)}
                          >
                            Manage Event
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share modal */}
      {shareInviteId && (() => {
        const invite = invites.find((item) => item.id === shareInviteId);
        if (!invite?.slug) return null;
        const inviteUrl = `${window.location.origin}/i/${invite.slug}`;
        const shareUrl = `${apiBaseUrl}/share/${invite.slug}`;
        const eventType = invite.templateCategory?.replace(/[_-]/g, " ") ?? "event";
        const message = buildShareMessage(invite.data as Record<string, unknown>, eventType, inviteUrl);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
            <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">Share Invitation</h3>
                <button onClick={() => setShareInviteId(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none" aria-label="Close">×</button>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-3 break-all">{inviteUrl}</p>
              <ShareMenu shareUrl={shareUrl} inviteUrl={inviteUrl} message={message} variant="stack" />
              <div className="mt-4 flex justify-center">
                <QRCodeCard url={inviteUrl} label={`/i/${invite.slug}`} size={180} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full shadow-xl">
            <div className="text-3xl text-center mb-3">⚠️</div>
            <h3 className="font-display text-lg font-semibold mb-2 text-center">Delete Invite</h3>
            <p className="text-sm text-muted-foreground font-body mb-6 text-center">
              This will permanently delete this invitation and all its RSVPs. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 font-body" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button variant="destructive" className="flex-1 font-body" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
