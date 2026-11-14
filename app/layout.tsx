import type { Metadata } from "next";
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
import { MobileLayout } from "@/components/mobile/mobile-layout";

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

export const metadata: Metadata = {
  title: "Basha Vara - Find Your Perfect Rental Home in Bangladesh",
  description: "Bangladesh's trusted rental housing marketplace connecting landlords with tenants. Find flats, apartments, and houses for rent across Dhaka and beyond.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <PushNotificationsProvider>
                <CapacitorNativeProvider>
                  <ErrorBoundary>
                    <StartupSplash />
                    <MobileLayout>
                      {children}
                    </MobileLayout>
                    <UpdateModal />
                  </ErrorBoundary>
                </CapacitorNativeProvider>
              </PushNotificationsProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
