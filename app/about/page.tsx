import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Shield, Users, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto mb-6">
              <Building2 className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">About Basha Vara</h1>
            <p className="text-xl text-muted-foreground">
              Bangladesh&apos;s trusted rental housing marketplace
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-6 w-6 mr-2 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To make renting in Bangladesh simple, transparent, and trustworthy for everyone. We connect landlords with tenants through a platform that prioritizes trust, ease of use, and local relevance.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-6 w-6 mr-2 text-primary" />
                  Our Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Trust and transparency in every interaction</li>
                  <li>• User-friendly experience for all users</li>
                  <li>• Local understanding of Bangladesh&apos;s rental market</li>
                  <li>• Commitment to user privacy and security</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-6 w-6 mr-2 text-primary" />
                  For Tenants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Browse verified listings, save favourites, request visits, and apply to rent your perfect home. Our platform makes it easy to find properties that match your budget and preferences.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-6 w-6 mr-2 text-primary" />
                  For Landlords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  List your properties, manage applications, review visit requests, and find the perfect tenants. Our tools help you streamline your rental process and reach more potential tenants.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Built for Bangladesh
              </h2>
              <p className="text-muted-foreground mb-6">
                Basha Vara is designed specifically for the Bangladeshi rental market, with features and workflows that understand local needs, from pricing in Bangladeshi Taka to area-specific search across Dhaka and beyond.
              </p>
              <p className="text-sm text-muted-foreground">
                This is a prototype demonstrating the frontend experience. The full production version will include backend integration, real authentication, and additional features.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
