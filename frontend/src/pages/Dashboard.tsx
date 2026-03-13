import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { MoreHorizontal, Search, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

const statusStyles: Record<string, string> = {
  published: "bg-accent text-accent-foreground",
  draft: "bg-secondary text-secondary-foreground",
  expired: "bg-muted text-muted-foreground",
  "taken-down": "bg-destructive/10 text-destructive",
};

const Dashboard = () => {
  const { isAuthenticated, user, logout } = useAuth();
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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    api.getInvites().then(setInvites).finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

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

  const checklist = [
    { label: "Choose a template", complete: invites.length > 0 },
    { label: "Start your first draft", complete: drafts > 0 || publishedInvites > 0 },
    { label: "Publish your invite", complete: publishedInvites > 0 },
    { label: "Share and collect RSVPs", complete: totalRsvps > 0 },
  ];

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

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
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-bold">Welcome, {user?.name?.split(" ")[0] || "there"}</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">Create, publish, share, and manage your live invite links in one place.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline"><Link to="/templates">Preview More Templates</Link></Button>
            <Button asChild><Link to="/templates">Create New Invite</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />) : [
              { label: "Total Invites", value: invites.length, hint: "All drafts and published invites" },
              { label: "Published", value: publishedInvites, hint: "Live links guests can open" },
              { label: "Total RSVPs", value: totalRsvps, hint: "Responses collected across invites" },
            ].map((stat) => (
              <div key={stat.label} className="p-6 rounded-xl border border-border bg-card">
                <p className="text-sm text-muted-foreground font-body">{stat.label}</p>
                <p className="text-3xl font-display font-bold mt-2">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-body mt-2">{stat.hint}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Getting started</h2>
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center text-xs ${item.complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {item.complete ? "✓" : ""}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.complete ? "Done" : "Pending"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="relative min-w-[220px] lg:max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by event, slug, or template" className="pl-9" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-body">
                <option value="all">All statuses</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="expired">Expired</option>
                <option value="taken-down">Taken down</option>
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-body">
                <option value="updated">Recently updated</option>
                <option value="created">Recently created</option>
                <option value="name">Name</option>
                <option value="rsvps">Most RSVPs</option>
              </select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-body">Use the filters to focus on drafts, live invites, or older links that need attention.</p>
        </div>

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

              return (
                <div key={invite.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-52 bg-muted/40 border-b border-border">
                    {template ? <TemplateThumbnail config={template} /> : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Preview unavailable</div>}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-lg truncate">{title}</h3>
                        <p className="text-xs text-muted-foreground font-body mt-1 capitalize">{invite.templateSlug.replace(/-/g, " ")}</p>
                        {invite.accessRole && invite.accessRole !== "owner" && (
                          <p className="text-[11px] text-muted-foreground font-body mt-1 capitalize">Workspace role: {invite.accessRole}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-body font-medium capitalize shrink-0 ${statusStyles[invite.status] || statusStyles.expired}`}>
                          {invite.status}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(invite.status === "draft" ? `/create/${invite.id}` : `/dashboard/invites/${invite.id}/edit`)}>
                              Edit invite
                            </DropdownMenuItem>
                            {invite.status === "published" && invite.slug && (
                              <DropdownMenuItem onClick={() => setShareInviteId(invite.id)}>
                                <Share2 className="w-4 h-4 mr-2" /> Share invite
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(invite.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete invite
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground font-body">
                      <p>{eventDate ? `Event date: ${new Date(eventDate).toLocaleDateString()}` : "Event date not added yet"}</p>
                      <p>{invite.rsvpCount} RSVPs collected</p>
                      <p>{invite.slug ? `/i/${invite.slug}` : "Share link unlocks after you choose a slug"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-5">
                      <Button asChild variant="outline" size="sm">
                        <Link to={invite.status === "draft" ? `/create/${invite.id}` : `/dashboard/invites/${invite.id}/edit`}>Edit</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/dashboard/invites/${invite.id}/operations`}>Operations</Link>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {invite.status === "published" && invite.slug ? (
                        <Button asChild size="sm">
                          <Link to={`/dashboard/invites/${invite.id}/rsvps`}>View RSVPs</Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm">
                          <Link to={invite.status === "draft" ? `/create/${invite.id}` : `/dashboard/invites/${invite.id}/edit`}>Continue</Link>
                        </Button>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/dashboard/invites/${invite.id}/operations`}>Guest Setup</Link>
                      </Button>
                    </div>

                    {invite.status === "published" && invite.slug && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/i/${invite.slug}`} target="_blank">Open Invite</Link>
                        </Button>
                        <Button size="sm" onClick={() => setShareInviteId(invite.id)}>Share</Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
