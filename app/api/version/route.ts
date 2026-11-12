import { NextResponse } from 'next/server';

export interface AppVersion {
  version: string;
  buildNumber: number;
  releaseDate: string;
  features: string[];
  isCritical: boolean;
  apkUrl?: string;
}

// Latest version (update this when deploying new features)
const LATEST_VERSION: AppVersion = {
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  buildNumber: Number(process.env.NEXT_PUBLIC_APP_BUILD_NUMBER || '1'),
  releaseDate: '2026-11-12',
  features: [
    'Custom amenities support - landlords can add custom amenities',
    'Enhanced document upload system with better UX',
    'Tenant profile documents management',
    'Improved admin dashboard with property management',
    'Real-time notification system',
    'Custom branding with professional splash screen',
    'Performance optimizations and faster loading',
    'OTA updates enabled for seamless app updates',
  ],
  isCritical: false,
  apkUrl: process.env.NEXT_PUBLIC_ANDROID_APK_URL || undefined,
};

export async function GET() {
  return NextResponse.json(LATEST_VERSION, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
