import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Investing Brain | Voice AI for Deep Tech Investing",
    template: "%s | Investing Brain",
  },
  description:
    "Talk to my investing thesis. Voice-first AI powered by real conviction in $PLTR, $HOOD, $TEM, $NBIS, and $AUR. Ask anything about my portfolio, moats, and catalysts.",
  keywords: [
    "investing AI",
    "voice AI investing",
    "tech stock analysis",
    "PLTR",
    "HOOD",
    "TEM",
    "NBIS",
    "AUR",
    "AI investing assistant",
    "stock thesis",
    "deep tech investing",
    "moat analysis",
  ],
  authors: [{ name: "Serkan Gundogan" }],
  creator: "Serkan Gundogan",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "https://whyibuy.io",
  },
  openGraph: {
    title: "Investing Brain | Voice AI for Deep Tech Investing",
    description:
      "Talk to my investing thesis. Voice-first AI powered by real conviction in $PLTR, $HOOD, $TEM, $NBIS, and $AUR.",
    url: "https://whyibuy.io",
    siteName: "Investing Brain",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Investing Brain | Voice AI for Deep Tech Investing",
    description:
      "Talk to my investing thesis. Voice-first AI powered by real conviction.",
    creator: "@serkangundogan",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL("https://whyibuy.io"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-W2D3837P');`,
          }}
        />
        {/* Google Analytics (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-50GZLG487C"
          strategy="afterInteractive"
        />
        <Script
          id="ga4-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-50GZLG487C');`,
          }}
        />
      </head>
      <body className="h-full antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Investing Brain",
              url: "https://whyibuy.io",
              description:
                "Voice-first AI that lets you talk to a deep tech investing thesis covering $PLTR, $HOOD, $TEM, $NBIS, and $AUR.",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              author: {
                "@type": "Person",
                name: "Serkan Gundogan",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W2D3837P"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
