import { HelpCircle } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Help Center</h1>
        </div>
        
        <div className="bg-card rounded-lg border p-8">
          <h2 className="text-xl font-semibold mb-4">How can we help you?</h2>
          <p className="text-muted-foreground mb-6">
            Our help center is coming soon. In the meantime, please contact us directly for support.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Contact Support</h3>
              <p className="text-sm text-muted-foreground">
                Email: support@bashavara.bd
              </p>
              <p className="text-sm text-muted-foreground">
                Phone: +880 1700-000000
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Common Issues</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>How to reset your password</li>
                <li>How to list a property</li>
                <li>How to contact a landlord</li>
                <li>Payment and billing questions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
