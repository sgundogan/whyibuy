import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Investing Brain — Talk to my investing thesis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          background: "linear-gradient(145deg, #0C0C0C 0%, #1a1410 50%, #0C0C0C 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Subtle glow */}
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,160,80,0.15) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
          }}
        />

        {/* Title */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span
            style={{
              fontSize: 64,
              fontWeight: 300,
              color: "#706860",
              letterSpacing: 8,
              textTransform: "uppercase",
            }}
          >
            Investing
          </span>
          <span
            style={{
              fontSize: 68,
              fontWeight: 500,
              color: "#c8a050",
              fontStyle: "italic",
              letterSpacing: 2,
            }}
          >
            Brain
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            marginTop: 24,
            fontSize: 28,
            color: "#706860",
            letterSpacing: 1,
            fontWeight: 300,
          }}
        >
          Talk to my investing thesis.
        </p>

        {/* Stock tickers */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 40,
          }}
        >
          {["PLTR", "HOOD", "TEM", "NBIS", "AUR"].map((ticker) => (
            <span
              key={ticker}
              style={{
                fontSize: 18,
                color: "#504838",
                letterSpacing: 3,
                fontWeight: 300,
              }}
            >
              {ticker}
            </span>
          ))}
        </div>

        {/* Domain */}
        <p
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "#504838",
            letterSpacing: 2,
          }}
        >
          whyibuy.io
        </p>
      </div>
    ),
    { ...size }
  );
}
