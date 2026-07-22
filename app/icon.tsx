import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

/** Favicon, zelfde "S"-merk als Nav/Footer — Next.js zet automatisch de juiste <link rel="icon">. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          backgroundColor: "#0f172a",
          color: "#10b981",
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
