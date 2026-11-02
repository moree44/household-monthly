import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { PrivacyProvider } from "@/features/privacy/privacy";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap"
});

export const preferredRegion = "sin1";

export const metadata: Metadata = {
  applicationName: "Household Monthly",
  title: "Household Monthly",
  description: "Private household expense tracker for daily and monthly spending.",
  appleWebApp: {
    capable: true,
    title: "Household",
    statusBarStyle: "default"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#171717"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-shell="web" suppressHydrationWarning>
      <body className={plusJakartaSans.variable} suppressHydrationWarning>
        <Script id="display-mode" strategy="beforeInteractive">
          {`(function(){try{var s=window.matchMedia("(display-mode: standalone)").matches||window.matchMedia("(display-mode: fullscreen)").matches||window.matchMedia("(display-mode: minimal-ui)").matches||window.navigator.standalone===true;document.documentElement.dataset.shell=s?"pwa":"web";}catch(e){document.documentElement.dataset.shell="web";}})();`}
        </Script>
        <PrivacyProvider>
          {children}
        </PrivacyProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
