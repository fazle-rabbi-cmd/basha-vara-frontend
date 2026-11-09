'use client';

import Link from 'next/link';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

const linkClass =
  'inline-flex min-h-9 items-center text-sm text-muted-foreground hover:text-primary transition-colors';

const quickLinks = [
  { href: '/properties', label: 'Browse Properties' },
  { href: '/about', label: 'About Us' },
  { href: '/help', label: 'Help Center' },
  { href: '/contact', label: 'Contact' },
];

const tenantLinks = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/tenant-guide', label: 'Tenant Guide' },
  { href: '/faq', label: 'FAQ' },
];

const landlordLinks = [
  { href: '/landlord-guide', label: 'Landlord Guide' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/resources', label: 'Resources' },
];

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title} className="min-w-0">
      <h3 className="font-semibold text-foreground mb-2 sm:mb-3">{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <footer className="w-full max-w-full overflow-hidden border-t border-border bg-muted/50">
      <div className="container mx-auto px-4 pt-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pt-12">
        {/* Mobile: brand full width, then 2 columns. Desktop: 4 columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4 min-w-0">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-6 w-6" />
              </span>
              <span className="text-xl font-bold text-foreground">Basha Vara</span>
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">
              Bangladesh&apos;s trusted rental housing marketplace connecting landlords with tenants.
            </p>
          </div>

          <LinkColumn title="Quick Links" links={quickLinks} />
          <LinkColumn title="For Tenants" links={tenantLinks} />
          <LinkColumn title="For Landlords" links={landlordLinks} />
        </div>

        {/* Contact + legal */}
        <div className="mt-8 border-t border-border pt-6 md:mt-10 md:pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Contact: mobile e stack, desktop e row (wrap kore) */}
            <ul className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
              <li className="flex min-w-0 items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <a href="mailto:support@bashavara.bd" className="min-w-0 break-words hover:text-primary transition-colors">
                  support@bashavara.bd
                </a>
              </li>
              <li className="flex min-w-0 items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <a href="tel:+8801700000000" className="hover:text-primary transition-colors">
                  +880 1700-000000
                </a>
              </li>
              <li className="flex min-w-0 items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Dhaka, Bangladesh</span>
              </li>
            </ul>

            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <Link href="/privacy" className="inline-flex min-h-9 items-center hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="inline-flex min-h-9 items-center hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            © {year} Basha Vara. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}