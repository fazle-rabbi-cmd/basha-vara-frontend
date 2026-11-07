import { ArrowRight, Search, Home, FileText } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">How It Works</h1>
        <p className="text-muted-foreground mb-12">
          Find your perfect rental property in just a few simple steps.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card rounded-lg border p-6 relative">
            <div className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">1. Search Properties</h3>
            <p className="text-sm text-muted-foreground">
              Browse through thousands of verified rental properties. Use filters to find the perfect match.
            </p>
            <ArrowRight className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block text-muted-foreground" />
          </div>
          
          <div className="bg-card rounded-lg border p-6 relative">
            <div className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full mb-4">
              <Home className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">2. Visit & Apply</h3>
            <p className="text-sm text-muted-foreground">
              Schedule visits to properties you like. Submit your rental application online.
            </p>
            <ArrowRight className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block text-muted-foreground" />
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">3. Move In</h3>
            <p className="text-sm text-muted-foreground">
              Sign the lease and move into your new home. Our platform makes it easy and secure.
            </p>
          </div>
        </div>
        
        <div className="mt-12 bg-card rounded-lg border p-8">
          <h2 className="text-xl font-semibold mb-4">For Landlords</h2>
          <p className="text-muted-foreground mb-4">
            List your property for free and find verified tenants quickly.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
            <li>Create a detailed property listing with photos</li>
            <li>Set your preferred rent and availability</li>
            <li>Review tenant applications and schedule visits</li>
            <li>Manage rental agreements online</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
