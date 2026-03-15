import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { adminApi } from "../services/api";
import { AdminTemplate } from "../types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const ALL_SECTIONS = ["hero", "story", "schedule", "gallery", "venue", "rsvp"];

const TemplateEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [template, setTemplate] = useState<AdminTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [packageCode, setPackageCode] = useState<"package_a" | "package_b">("package_a");
  const [tags, setTags] = useState("");
  const [priceUsd, setPriceUsd] = useState(0);
  const [priceEur, setPriceEur] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sections, setSections] = useState<string[]>([]);

  useEffect(() => {
    if (!slug) {
      return;
    }
    adminApi
      .getTemplate(slug)
      .then((data) => {
        setTemplate(data);
        setName(data.name);
        setCategory(data.category);
        setPackageCode(data.packageCode);
        setTags(data.tags.join(", "));
        setPriceUsd(data.priceUsd);
        setPriceEur(data.priceEur);
        setIsVisible(data.isVisible);
        setIsFeatured(data.isFeatured);
        setSections(data.supportedSections);
      })
      .catch(() => navigate("/admin/templates"))
      .finally(() => setLoading(false));
  }, [navigate, slug]);

  const handleSave = async () => {
    if (!slug) {
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateTemplate(slug, {
        name,
        packageCode,
        isPremium: true,
        price: priceUsd,
        priceUsd,
        priceEur,
        isVisible,
        isFeatured,
      });
      toast({ title: "Template updated" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout breadcrumbs={[{ label: "Templates", to: "/admin/templates" }, { label: "Loading..." }]} requiredPermission="manage_templates">
        <Skeleton className="h-96 rounded-lg" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout breadcrumbs={[{ label: "Templates", to: "/admin/templates" }, { label: name }]} requiredPermission="manage_templates">
      <div className="max-w-2xl space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Edit Template</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(event) => setName(event.target.value)} /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={slug} disabled className="bg-muted" /></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["wedding", "birthday", "engagement", "corporate", "baby-shower", "anniversary"].map((item) => (
                    <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Package</Label>
              <Select value={packageCode} onValueChange={(value) => setPackageCode(value as "package_a" | "package_b")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="package_a">Package A</SelectItem>
                  <SelectItem value="package_b">Package B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={tags} onChange={(event) => setTags(event.target.value)} /></div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2"><Switch checked={isVisible} onCheckedChange={setIsVisible} /><Label>Visible in gallery</Label></div>
            <div className="flex items-center gap-2"><Switch checked={isFeatured} onCheckedChange={setIsFeatured} /><Label>Featured</Label></div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-xl">
            <div className="space-y-2">
              <Label>USD Price (cents)</Label>
              <Input type="number" value={priceUsd} onChange={(event) => setPriceUsd(Number(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>EUR Price (cents)</Label>
              <Input type="number" value={priceEur} onChange={(event) => setPriceEur(Number(event.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Supported Sections</Label>
            <div className="flex flex-wrap gap-3">
              {ALL_SECTIONS.map((section) => (
                <label key={section} className="flex items-center gap-1.5 text-sm capitalize cursor-pointer">
                  <Checkbox
                    checked={sections.includes(section)}
                    onCheckedChange={(checked) =>
                      setSections((previous) =>
                        checked ? [...previous, section] : previous.filter((value) => value !== section),
                      )
                    }
                  />
                  {section}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          <Button variant="outline" onClick={() => navigate("/admin/templates")}>Cancel</Button>
          <Button variant="outline" onClick={() => window.open(`/templates/${slug}/preview`, "_blank")}>View Preview</Button>
        </div>

        {template && (
          <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
            <p>Purchases: {template.purchaseCount} · Previews: {template.previewCount} · Active invites: {template.activeInviteCount}</p>
            <p>Added: {template.dateAdded}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TemplateEdit;
