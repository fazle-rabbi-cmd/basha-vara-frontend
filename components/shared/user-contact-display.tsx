'use client';

import { Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserContactDisplayProps {
  user: {
    email: string;
    phone?: string;
    emailVisibility?: 'PLATFORM_ONLY' | 'MASKED' | 'FULL';
    phoneVisibility?: 'PLATFORM_ONLY' | 'MASKED' | 'FULL';
  };
  showContactButton?: boolean;
  onContactViaPlatform?: () => void;
}

export function UserContactDisplay({
  user,
  showContactButton = false,
  onContactViaPlatform,
}: UserContactDisplayProps) {
  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return phone;
    if (phone.length <= 4) return phone;
    return phone.replace(/(\+\d{3})\d+(\d{4})$/, '$1****$2');
  };

  const displayEmail = user.emailVisibility === 'FULL' ? user.email : maskEmail(user.email);
  const displayPhone = user.phone
    ? user.phoneVisibility === 'FULL'
      ? user.phone
      : maskPhone(user.phone)
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{displayEmail}</span>
        {user.emailVisibility !== 'FULL' && showContactButton && onContactViaPlatform && (
          <Button size="sm" variant="ghost" onClick={onContactViaPlatform} className="h-6 text-xs">
            Contact via Platform
          </Button>
        )}
      </div>
      {displayPhone && (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{displayPhone}</span>
          {user.phoneVisibility !== 'FULL' && showContactButton && onContactViaPlatform && (
            <Button size="sm" variant="ghost" onClick={onContactViaPlatform} className="h-6 text-xs">
              Contact via Platform
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
