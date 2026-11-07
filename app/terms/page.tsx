import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Terms of Service</h1>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: November 7, 2026
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground mb-6">
            By accessing or using Basha Vara, you agree to be bound by these Terms of Service.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">User Accounts</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You are responsible for maintaining the confidentiality of your account and password.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-6">
            <li>Provide accurate and complete information</li>
            <li>Keep your password secure</li>
            <li>Notify us of unauthorized access</li>
            <li>You are responsible for all activity under your account</li>
          </ul>
          
          <h2 className="text-xl font-semibold mb-4">Property Listings</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Landlords are responsible for the accuracy of their property listings.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-6">
            <li>Listings must be accurate and truthful</li>
            <li>Photos must represent the actual property</li>
            <li>Rent prices must be clearly stated</li>
            <li>False listings are prohibited</li>
          </ul>
          
          <h2 className="text-xl font-semibold mb-4">Prohibited Activities</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You may not use our platform for illegal or unauthorized purposes.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-6">
            <li>Post false or misleading information</li>
            <li>Attempt to gain unauthorized access</li>
            <li>Harass other users</li>
            <li>Violate any applicable laws</li>
          </ul>
          
          <h2 className="text-xl font-semibold mb-4">Payment Terms</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Payment arrangements are made directly between tenants and landlords. Basha Vara does not handle payments.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Basha Vara is not responsible for any disputes between tenants and landlords. We provide the platform for connection only.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Termination</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We reserve the right to terminate accounts that violate these terms or engage in fraudulent activity.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Changes to Terms</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We may update these terms from time to time. Continued use of the platform constitutes acceptance of changes.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <p className="text-sm text-muted-foreground">
            If you have questions about these terms, please contact us at support@bashavara.bd
          </p>
        </div>
      </div>
    </div>
  );
}
