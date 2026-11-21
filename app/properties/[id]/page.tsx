import { PropertyDetailContent } from './property-detail-content';

// Generate static params for static export
export async function generateStaticParams() {
  // Generate a placeholder route for static export
  // The app will use client-side navigation for actual property details
  return [{ id: '00000000-0000-0000-0000-000000000000' }];
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PropertyDetailContent propertyId={id} />;
}
