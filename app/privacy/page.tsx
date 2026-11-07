import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: November 7, 2026
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We collect information you provide directly to us, such as when you create an account, list a property, or contact us.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-6">
            <li>Name and contact information</li>
            <li>Account credentials</li>
            <li>Property details and photos</li>
            <li>Communication history</li>
          </ul>
          
          <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We use the information we collect to provide, maintain, and improve our services.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-6">
            <li>Facilitate property rentals</li>
            <li>Communicate with you</li>
            <li>Improve our platform</li>
            <li>Prevent fraud and abuse</li>
          </ul>
          
          <h2 className="text-xl font-semibold mb-4">Information Sharing</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We do not sell your personal information. We may share information with landlords and tenants as necessary for rental transactions.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Data Security</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We implement security measures to protect your information, including encryption and secure servers.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You have the right to access, update, or delete your personal information at any time through your account settings.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <p className="text-sm text-muted-foreground">
            If you have questions about this privacy policy, please contact us at support@bashavara.bd
          </p>
        </div>
      </div>
    </div>
  );
}
