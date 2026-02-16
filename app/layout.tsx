import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToasterWithTheme } from "@/components/ToasterWithTheme";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const themeScript = `
(function(){
  var k='vamo-theme';
  var s=typeof localStorage!=='undefined'?localStorage.getItem(k):null;
  var d=s==='dark'||(s!=='light'&&typeof matchMedia!=='undefined'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark',d);
})();
`;

export const metadata: Metadata = {
  title: "Vamo – Build, Track, Ship Your Startup",
  description: "Iterate on your startup UI and business progress in parallel. Earn pineapples for real progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="font-body">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          {children}
          <ToasterWithTheme />
          <AnalyticsTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
