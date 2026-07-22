import { ImageResponse } from "next/og";

export const alt = "Statieclub — statiegeld inzamelen voor jouw sportclub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamisch gegenereerde Open Graph-/Twitter-card (via `next/og`) in
 * de bestaande merkstijl (donker canvas, emerald "S"-blok — zelfde
 * recept als `Nav.tsx`/`Footer.tsx`) i.p.v. een los ontworpen
 * `public/og-image.png` dat niet bestond. `app/layout.tsx` verwijst
 * naar dit bestandsconventie-pad automatisch — geen aparte
 * metadata-koppeling nodig.
 */
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.25), transparent 55%), radial-gradient(circle at 85% 75%, rgba(59,130,246,0.18), transparent 50%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 104,
              height: 104,
              borderRadius: 28,
              backgroundColor: "#10b981",
              color: "#0f172a",
              fontSize: 64,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 88, fontWeight: 800, color: "#ffffff", letterSpacing: -2 }}>Statieclub</div>
        </div>
        <div style={{ marginTop: 32, fontSize: 40, color: "#d1fae5", fontWeight: 600 }}>
          Statiegeld inzamelen voor je club
        </div>
        <div style={{ marginTop: 16, fontSize: 26, color: "#94a3b8" }}>
          Gratis · Duurzaam · Zonder spreadsheets
        </div>
      </div>
    ),
    { ...size }
  );
}
