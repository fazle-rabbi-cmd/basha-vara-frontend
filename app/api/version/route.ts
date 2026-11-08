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
  releaseDate: '2026-11-06',
  features: [
    'Custom branding with beautiful splash screen',
    'Performance optimizations',
    'OTA updates enabled',
  ],
  isCritical: false,
  apkUrl: process.env.NEXT_PUBLIC_ANDROID_APK_URL || undefined,
};

export async function GET() {
  return NextResponse.json(LATEST_VERSION, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
