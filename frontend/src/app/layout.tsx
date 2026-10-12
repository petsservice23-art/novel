import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Novelverse — Read Fantasy, Romance & Drama Novels Online",
  description: "Read fantasy and romance novels online. Free chapters, premium content, and a clean reading experience.",
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
          <Toaster position="bottom-right" toastOptions={{
            style: {
              background: 'var(--bg-secondary)',
              color: '#fff',
              border: '1px solid var(--border)',
            }
          }}/>
        </AuthProvider>
      </body>
    </html>
  );
}
