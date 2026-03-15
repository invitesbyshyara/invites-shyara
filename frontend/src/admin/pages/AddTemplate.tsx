import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { adminApi } from "../services/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const ALL_SECTIONS = ["hero", "story", "schedule", "gallery", "venue", "rsvp"];

const AddTemplate: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("wedding");
  const [packageCode, setPackageCode] = useState<"package_a" | "package_b">("package_a");
  const [tags, setTags] = useState("");
  const [priceUsd, setPriceUsd] = useState(14900);
  const [priceEur, setPriceEur] = useState(16900);
  const [sections, setSections] = useState<string[]>(["hero", "rsvp"]);
  const [saving, setSaving] = useState(false);

  const autoSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === autoSlug(name)) {
      setSlug(autoSlug(value));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await adminApi.createTemplate({
        slug,
        name,
        category,
        packageCode,
        tags: tags.split(",").map((item) => item.trim()).filter(Boolean),
        isPremium: true,
        price: priceUsd,
        priceUsd,
        priceEur,
        isVisible: true,
        isFeatured: false,
      });
      toast({ title: "Template config created" });
      navigate("/admin/templates");
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout breadcrumbs={[{ label: "Templates", to: "/admin/templates" }, { label: "Add Template" }]} requiredPermission="manage_templates">
      <div className="max-w-2xl">
        <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 border border-amber-200 mb-6 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            After saving the config here, the template component files must still exist in the codebase under
            <code className="bg-amber-100 px-1 rounded text-xs"> src/templates/[category]/[slug]/ </code>.
          </p>
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-4">Add New Template</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(event) => handleNameChange(event.target.value)} required /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={slug} onChange={(event) => setSlug(event.target.value)} required /></div>
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
            <div className="space-y-2"><Label>Tags</Label><Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="elegant, gold, premium" /></div>
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
                      setSections((previous) => (checked ? [...previous, section] : previous.filter((value) => value !== section)))
                    }
                  />
                  {section}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Template Config"}</Button>
            <Button type="button" variant="outline" onClick={() => navigate("/admin/templates")}>Cancel</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddTemplate;
