import { Router } from "express";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";

const router = Router();

/**
 * GET /share/:slug
 *
 * Returns a minimal HTML page with Open Graph meta tags for the invite.
 * Social media crawlers (Facebook, iMessage, Discord) will read these meta tags
 * for link previews. Human browsers are immediately JS-redirected to the SPA.
 *
 * OG image is generated via Cloudinary URL-based text overlay — no extra libraries needed.
 */
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;

  if (!slug || !/^[a-z0-9-]{3,60}$/.test(slug)) {
    return res.redirect(302, env.FRONTEND_URL);
  }

  let title = "You're Invited!";
  let description = "Open your digital invitation on Shyara.";
  let ogImage = `${env.FRONTEND_URL}/og-image.svg`; // fallback

  try {
    const invite = await prisma.invite.findUnique({
      where: { slug },
      select: { data: true, templateSlug: true, templateCategory: true, status: true },
    });

    if (invite && invite.status === "published") {
      const data = (invite.data ?? {}) as Record<string, unknown>;

      // Build title from guest/host names
      const names = [data.brideName, data.groomName, data.hostName, data.coupleName]
        .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
        .join(" & ");

      const eventType =
        typeof data.eventTitle === "string" && data.eventTitle.trim()
          ? data.eventTitle
          : invite.templateCategory.replace(/_/g, " ");

      title = names
        ? `You're Invited to ${names}'s ${eventType}!`
        : `You're Invited to ${eventType}!`;

      // Build description with event date and venue
      const parts: string[] = [];
      const dateStr =
        typeof data.eventDate === "string" ? data.eventDate
        : typeof data.weddingDate === "string" ? data.weddingDate
        : null;

      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          parts.push(d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }));
        }
      }

      const venue = typeof data.venueName === "string" ? data.venueName : null;
      if (venue) parts.push(venue);

      description = parts.length > 0
        ? parts.join(" · ")
        : "Open your digital invitation on Shyara.";

      // Build Cloudinary OG image with text overlay
      // Uses the hero/cover photo if available, otherwise a branded default
      const heroPhoto =
        typeof data.heroImage === "string" ? data.heroImage
        : typeof data.coverPhoto === "string" ? data.coverPhoto
        : null;

      if (heroPhoto && heroPhoto.includes("res.cloudinary.com")) {
        // Overlay the names as text on the uploaded photo
        const nameText = names
          ? encodeURIComponent(names.replace(/,/g, "\\,").replace(/\//g, "\\/"))
          : null;

        if (nameText) {
          // l_text:overlay on image — aspect ratio 1200x630 (OG standard)
          const overlays = [
            "w_1200,h_630,c_fill,g_center",
            "e_brightness:-15",
            `l_text:Playfair_Display_40_bold:${nameText},co_white,g_south,y_80`,
          ].join("/");
          ogImage = heroPhoto.replace("/upload/", `/upload/${overlays}/`);
        } else {
          ogImage = heroPhoto.replace("/upload/", "/upload/w_1200,h_630,c_fill,g_center/");
        }
      }
    }
  } catch {
    // Fall through with defaults — don't break sharing if DB is unavailable
  }

  const spaUrl = `${env.FRONTEND_URL}/i/${slug}`;

  // Escape strings for use in HTML attributes
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Shyara" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${esc(spaUrl)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(ogImage)}" />

  <!-- Canonical -->
  <link rel="canonical" href="${esc(spaUrl)}" />

  <!-- Redirect humans to the SPA immediately -->
  <meta http-equiv="refresh" content="0; url=${esc(spaUrl)}" />
</head>
<body>
  <p style="font-family:sans-serif;text-align:center;padding:40px;color:#888">
    Redirecting to your invitation&hellip;
    <br /><br />
    <a href="${esc(spaUrl)}" style="color:#c06090">Click here if you are not redirected</a>
  </p>
  <script>window.location.replace(${JSON.stringify(spaUrl)});</script>
</body>
</html>`;

  res
    .status(200)
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
    .send(html);
});

export default router;
