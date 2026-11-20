import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth/auth-context";
import { ToastProvider } from "@/components/shared/toast";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { UpdateModal } from "@/components/shared/update-modal";
import { StartupSplash } from "@/components/shared/startup-splash";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { PushNotificationsProvider } from "@/lib/push-notifications/push-notifications-provider";
import { CapacitorNativeProvider } from "@/components/shared/capacitor-native-provider";
import { PlatformProvider } from "@/lib/platform/platform-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#14b8a6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1115" },
  ],
};

export const metadata: Metadata = {
  title: "Basha Vara - Find Your Perfect Rental Home in Bangladesh",
  description: "Bangladesh's trusted rental housing marketplace connecting landlords with tenants. Find flats, apartments, and houses for rent across Dhaka and beyond.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Basha Vara",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.webp", sizes: "192x192", type: "image/webp" },
      { url: "/icons/icon-512.webp", sizes: "512x512", type: "image/webp" },
    ],
    apple: [
      { url: "/icons/icon-192.webp", sizes: "192x192", type: "image/webp" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/icons/icon-48.webp" />
        <link rel="icon" href="/icons/icon-48.webp" sizes="48x48" />
        <link rel="icon" href="/icons/icon-192.webp" sizes="192x192" />
        <link rel="icon" href="/icons/icon-512.webp" sizes="512x512" />
        <link rel="apple-touch-icon" href="/icons/icon-192.webp" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <PushNotificationsProvider>
                <PlatformProvider>
                  <CapacitorNativeProvider>
                    <ErrorBoundary>
                      <StartupSplash />
                      {children}
                      <UpdateModal />
                    </ErrorBoundary>
                  </CapacitorNativeProvider>
                </PlatformProvider>
              </PushNotificationsProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
