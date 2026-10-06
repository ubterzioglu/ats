import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ATS readability";

export default async function Image() {
  const metadata = await getTranslations({ locale: "en", namespace: "metadata" });

  let logoDataUrl: string;
  try {
    const logoPath = join(process.cwd(), "public", "brand", "affa-logo-black.png");
    const logoBuffer = await readFile(logoPath);
    logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    logoDataUrl = "";
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#000",
          color: "rgb(255, 255, 255)"
        }}
      >
        {logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoDataUrl}
            alt="ATS readability"
            style={{
              width: "760px",
              height: "auto",
              marginBottom: "32px"
            }}
          />
        ) : null}
        <h1
          style={{
            fontSize: "52px",
            fontWeight: 700,
            lineHeight: 1.1,
            margin: 0,
            maxWidth: "900px",
            textAlign: "center",
            letterSpacing: "-0.02em"
          }}
        >
          {metadata("openGraphTitle")}
        </h1>
      </div>
    ),
    { ...size }
  );
}
