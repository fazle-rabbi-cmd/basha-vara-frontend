import { Building2 } from 'lucide-react';

export default function LandlordGuidePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Landlord Guide</h1>
        </div>
        
        <div className="space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Creating Your Listing</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Provide accurate and detailed property information</li>
              <li>Upload high-quality photos of the property</li>
              <li>Set a competitive rent based on market rates</li>
              <li>Include all amenities and features</li>
              <li>Be honest about property condition</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Managing Applications</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Review tenant profiles and applications carefully</li>
              <li>Check tenant references if needed</li>
              <li>Respond to applications promptly</li>
              <li>Schedule visits with interested tenants</li>
              <li>Keep communication professional</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Conducting Property Visits</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Prepare the property before visits</li>
              <li>Be available at scheduled times</li>
              <li>Highlight key features and amenities</li>
              <li>Answer questions honestly</li>
              <li>Provide lease terms upfront</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Finalizing the Lease</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Prepare a clear lease agreement</li>
              <li>Explain all terms to the tenant</li>
              <li>Collect security deposit as per agreement</li>
              <li>Document property condition before handover</li>
              <li>Provide keys and access information</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Best Practices</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Maintain your property regularly</li>
              <li>Respond to tenant requests promptly</li>
              <li>Keep records of all communications</li>
              <li>Follow local rental laws and regulations</li>
              <li>Build good relationships with tenants</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
