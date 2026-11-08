import { NextResponse } from 'next/server';

export interface AppVersion {
  version: string;
  buildNumber: number;
  releaseDate: string;
  features: string[];
  isCritical: boolean;
}

// Latest version (update this when deploying new features)
const LATEST_VERSION: AppVersion = {
  version: '1.0.0',
  buildNumber: 1,
  releaseDate: '2026-11-06',
  features: [
    'Custom branding with beautiful splash screen',
    'Performance optimizations',
    'OTA updates enabled',
  ],
  isCritical: false,
};

export async function GET() {
  return NextResponse.json(LATEST_VERSION, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
