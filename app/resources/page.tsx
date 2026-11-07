import { FileText, Download, ExternalLink } from 'lucide-react';

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Resources</h1>
        <p className="text-muted-foreground mb-12">
          Helpful resources for landlords and tenants.
        </p>
        
        <div className="space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Rental Agreement Templates</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Download our standard rental agreement templates for Bangladesh.
            </p>
            <div className="space-y-2">
              <a href="#" className="flex items-center space-x-2 text-sm text-primary hover:underline">
                <Download className="h-4 w-4" />
                <span>Standard Residential Lease (PDF)</span>
              </a>
              <a href="#" className="flex items-center space-x-2 text-sm text-primary hover:underline">
                <Download className="h-4 w-4" />
                <span>Month-to-Month Agreement (PDF)</span>
              </a>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Property Inspection Checklist</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use this checklist when inspecting properties before renting.
            </p>
            <a href="#" className="flex items-center space-x-2 text-sm text-primary hover:underline">
              <Download className="h-4 w-4" />
              <span>Inspection Checklist (PDF)</span>
            </a>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Legal Information</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Understand your rights and responsibilities under Bangladesh rental laws.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm">
                <ExternalLink className="h-4 w-4 text-primary" />
                <a href="#" className="text-primary hover:underline">
                  Bangladesh Rent Control Act
                </a>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <ExternalLink className="h-4 w-4 text-primary" />
                <a href="#" className="text-primary hover:underline">
                  Tenant Rights Guide
                </a>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <ExternalLink className="h-4 w-4 text-primary" />
                <a href="#" className="text-primary hover:underline">
                  Landlord Responsibilities
                </a>
              </li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Helpful Articles</h2>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-primary hover:underline">
                  How to Prepare Your Property for Rent
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary hover:underline">
                  Setting the Right Rent Price
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary hover:underline">
                  Screening Tenants Effectively
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary hover:underline">
                  Understanding Security Deposits
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary hover:underline">
                  Handling Maintenance Requests
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
