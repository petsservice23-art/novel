import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import SupportChatWidget from "@/components/SupportChatWidget";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffcfe" },
    { media: "(prefers-color-scheme: dark)", color: "#15121b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.segyenovels.space"),
  title: {
    default: "SegyeNovels — Read Web Novels Online",
    template: "%s | SegyeNovels",
  },
  description: "Discover and read thousands of web novels online across fantasy, romance, action, sci-fi, and reincarnation. Free chapters updated daily with a clean, aesthetic reading experience.",
  keywords: [
    "SegyeNovels",
    "read web novels online",
    "read online web novels",
    "web novels online",
    "read web novels",
    "translated web novels",
    "fantasy web novels",
    "romance web novels",
    "free web novels",
    "light novels",
    "martial arts novels",
    "wuxia",
    "xianxia"
  ],
  authors: [{ name: "SegyeNovels Team" }],
  creator: "SegyeNovels",
  publisher: "SegyeNovels",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "SegyeNovels — Read Web Novels Online",
    description: "Discover and read thousands of web novels online across fantasy, romance, action, sci-fi, and reincarnation. Free chapters updated daily with an aesthetic, minimalist reading experience.",
    url: "/",
    siteName: "SegyeNovels",
    images: [
      {
        url: "/images/logo-wordmark.png",
        width: 1200,
        height: 630,
        alt: "SegyeNovels Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SegyeNovels — Read Web Novels Online",
    description: "Discover and read thousands of web novels online across fantasy, romance, action, sci-fi, and reincarnation. Free chapters updated daily with an aesthetic, minimalist reading experience.",
    images: ["/images/logo-wordmark.png"],
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://segyenovels.space/#organization",
                  "name": "SegyeNovels",
                  "url": "https://segyenovels.space",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://segyenovels.space/favicon-192x192.png",
                    "width": 192,
                    "height": 192
                  },
                  "description": "SegyeNovels is an online web novel reading platform offering stories across genres like fantasy, romance, action, and sci-fi with daily free chapter updates.",
                  "email": "segyenovels@gmail.com",
                  "sameAs": [
                    "https://twitter.com/segyenovels",
                    "https://www.instagram.com/segyenovels",
                    "https://www.youtube.com/@segyenovels"
                  ]
                },
                {
                  "@type": "WebSite",
                  "@id": "https://segyenovels.space/#website",
                  "url": "https://segyenovels.space",
                  "name": "SegyeNovels",
                  "description": "Discover and read thousands of web novels online across fantasy, romance, action, sci-fi, and more. Free chapters updated daily.",
                  "publisher": {
                    "@id": "https://segyenovels.space/#organization"
                  },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://segyenovels.space/search?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                }
              ]
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme') || 'dark';
                  var resolved = t;
                  if (t === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', resolved);
                  if (resolved === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 64px)' }} className="pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <BottomNav />
          <SupportChatWidget />
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                boxShadow: 'var(--shadow-md)',
              }
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
