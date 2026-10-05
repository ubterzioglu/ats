import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ATS readability";

export default async function Image() {
  const metadata = await getTranslations({ locale: "en", namespace: "metadata" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background: "rgb(0, 0, 0)",
          color: "rgb(255, 255, 255)"
        }}
      >
        <div
          style={{
            display: "flex",
            width: "48px",
            height: "48px",
            marginBottom: "32px"
          }}
        >
          <svg viewBox="0 0 24 24" width="48" height="48">
            <defs>
              <linearGradient id="g" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#8052ff" />
                <stop offset="1" stopColor="#15846e" />
              </linearGradient>
            </defs>
            <path d="M12 2 22 21H2L12 2Z" fill="url(#g)" />
            <path d="M12 9.5 16.6 18H7.4L12 9.5Z" fill="#000" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: "56px",
            fontWeight: 400,
            lineHeight: 1.1,
            margin: 0,
            maxWidth: "800px",
            letterSpacing: "-0.02em"
          }}
        >
          {metadata("openGraphTitle")}
        </h1>
        <p
          style={{
            fontSize: "24px",
            fontWeight: 200,
            lineHeight: 1.5,
            margin: "24px 0 0",
            maxWidth: "700px",
            color: "rgb(154, 154, 154)"
          }}
        >
          {metadata("openGraphDescription")}
        </p>
      </div>
    ),
    { ...size }
  );
}
