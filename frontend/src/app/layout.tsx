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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "SegyeNovels — Read Korean & Asian Web Novels Online",
    template: "%s | SegyeNovels",
  },
  description: "Immerse yourself in SegyeNovels: read completed and ongoing Korean web novels, fantasy, romance, martial arts, and reincarnation stories with a clean, aesthetic reading experience.",
  keywords: [
    "SegyeNovels",
    "Korean web novels",
    "read web novels online",
    "translated web novels",
    "fantasy novels",
    "romance web novels",
    "korean fantasy",
    "light novels",
    "wuxia",
    "xianxia"
  ],
  authors: [{ name: "SegyeNovels Team" }],
  creator: "SegyeNovels",
  publisher: "SegyeNovels",
  icons: {
    icon: [
      { url: "/images/logo-symbol.png", sizes: "any" },
      { url: "/favicon.png", sizes: "any" }
    ],
    apple: "/images/logo-symbol.png",
  },
  openGraph: {
    title: "SegyeNovels — Read Korean & Asian Web Novels Online",
    description: "Read thousands of completed Korean web novels, fantasy, romance, and reincarnation stories with an aesthetic, minimalist reading experience.",
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
    title: "SegyeNovels — Read Korean & Asian Web Novels Online",
    description: "Read thousands of completed Korean web novels, fantasy, romance, and reincarnation stories with an aesthetic, minimalist reading experience.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
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
