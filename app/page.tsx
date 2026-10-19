'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockProperties } from '@/mocks/data';
import { PropertyCard } from '@/components/shared/property-card';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [featuredProperties, setFeaturedProperties] = useState(mockProperties.slice(0, 6));

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQuery = formData.get('search') as string;
    const area = formData.get('area') as string;
    const propertyType = formData.get('propertyType') as string;

    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (area) params.set('area', area);
    if (propertyType) params.set('type', propertyType);

    router.push(`/properties${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Find Your Perfect Rental Home in Bangladesh
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Browse thousands of verified properties from trusted landlords across Dhaka and beyond.
            </p>
          </div>

          {/* Search Box */}
          <Card className="max-w-4xl mx-auto shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      name="search"
                      placeholder="Search by location, property type..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select name="area" className="w-full md:w-48">
                  <option value="">All Areas</option>
                  <option value="Dhanmondi">Dhanmondi</option>
                  <option value="Gulshan">Gulshan</option>
                  <option value="Banani">Banani</option>
                  <option value="Mirpur">Mirpur</option>
                  <option value="Uttara">Uttara</option>
                  <option value="Mohammadpur">Mohammadpur</option>
                </Select>
                <Select name="propertyType" className="w-full md:w-48">
                  <option value="">Property Type</option>
                  <option value="flat">Flat</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                </Select>
                <Button type="submit" size="lg" className="w-full md:w-auto">
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Featured Properties</h2>
              <p className="text-muted-foreground">Hand-picked properties for you</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/properties">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => <PropertyCardSkeleton key={i} />)
            ) : (
              featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Are you a landlord?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              List your property on Basha Vara and connect with thousands of potential tenants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/register?role=landlord">List Your Property</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Easy Search</h3>
              <p className="text-muted-foreground">
                Find properties by location, budget, and preferences with our advanced search.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Verified Listings</h3>
              <p className="text-muted-foreground">
                All listings are verified to ensure accuracy and build trust.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Local Focus</h3>
              <p className="text-muted-foreground">
                Designed specifically for the Bangladesh rental market.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
