import { DollarSign, Check } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center">Pricing</h1>
        <p className="text-muted-foreground mb-12 text-center">
          Simple, transparent pricing for landlords. Free for tenants.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-2">Basic</h3>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-3xl font-bold">Free</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Perfect for getting started
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>List up to 3 properties</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Basic property features</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Receive tenant applications</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Email support</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border-2 border-primary p-6 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
              Popular
            </div>
            <h3 className="text-lg font-semibold mb-2">Professional</h3>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-3xl font-bold">৳499</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              For serious landlords
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Unlimited property listings</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Photo gallery (up to 20)</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Priority listing placement</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-2">Enterprise</h3>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-3xl font-bold">৳1499</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              For property management companies
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Everything in Professional</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Team accounts</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Custom branding</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>API access</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Dedicated account manager</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 bg-card rounded-lg border p-8">
          <h2 className="text-xl font-semibold mb-4">For Tenants</h2>
          <p className="text-muted-foreground">
            Basha Vara is completely free for tenants. No hidden fees, no commissions. Find your perfect rental property without any cost.
          </p>
        </div>
      </div>
    </div>
  );
}
