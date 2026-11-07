import { HelpCircle } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        </div>
        
        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Is Basha Vara free to use?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, Basha Vara is completely free for tenants. Landlords can list properties for free with optional premium features.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">How do I contact a landlord?</h3>
            <p className="text-sm text-muted-foreground">
              Once you find a property you're interested in, you can send a message directly to the landlord through our platform.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Are the properties verified?</h3>
            <p className="text-sm text-muted-foreground">
              We work to verify property listings and landlord profiles. However, we recommend visiting properties before making any decisions.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">How do I list my property?</h3>
            <p className="text-sm text-muted-foreground">
              Create a landlord account, go to your dashboard, and click "Add Property". Fill in the details and upload photos to get started.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">What payment methods are accepted?</h3>
            <p className="text-sm text-muted-foreground">
              Payment arrangements are made directly between tenants and landlords. Our platform facilitates the connection but doesn't handle payments.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">How do I reset my password?</h3>
            <p className="text-sm text-muted-foreground">
              Click "Forgot Password" on the login page, enter your email, and follow the instructions sent to your email.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Can I edit my property listing?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, landlords can edit their property listings at any time through their dashboard.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">How do I report a problem?</h3>
            <p className="text-sm text-muted-foreground">
              If you encounter any issues, please contact our support team at support@bashavara.bd or call +880 1700-000000.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
