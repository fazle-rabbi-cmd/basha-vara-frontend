import { BookOpen } from 'lucide-react';

export default function TenantGuidePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Tenant Guide</h1>
        </div>
        
        <div className="space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Finding the Right Property</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Use our advanced filters to narrow down your search</li>
              <li>Check property details including amenities and location</li>
              <li>Verify the landlord's profile and response rate</li>
              <li>Read property descriptions carefully</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Scheduling Visits</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Request a visit through our platform</li>
              <li>Be punctual for scheduled visits</li>
              <li>Prepare questions about the property</li>
              <li>Inspect the property thoroughly</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Applying for Rentals</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Complete your profile with accurate information</li>
              <li>Submit required documents promptly</li>
              <li>Be honest about your budget and requirements</li>
              <li>Follow up politely on your application</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Signing the Lease</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Read the lease agreement carefully</li>
              <li>Understand all terms and conditions</li>
              <li>Clarify any doubts before signing</li>
              <li>Keep a copy of the signed agreement</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Safety Tips</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Always visit the property before making payment</li>
              <li>Never share sensitive financial information</li>
              <li>Use our platform for all communications</li>
              <li>Report suspicious activity to support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
