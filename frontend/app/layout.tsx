import type { Metadata } from "next";
import { Outfit, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexora — Disaster response coordination for Bangladesh",
  description:
    "A coordination layer where NGOs publish disaster-response events and volunteers join, participate, and earn certificates.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${outfit.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-red-500 selection:text-white">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('nexora-theme');if(t!=='dark'&&t!=='light')t='light';var r=document.documentElement;r.dataset.theme=t;r.classList.toggle('dark',t==='dark');}catch(e){}})()`,
          }}
        />
        {children}
        <div className="fixed bottom-4 right-4 z-[100]">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
