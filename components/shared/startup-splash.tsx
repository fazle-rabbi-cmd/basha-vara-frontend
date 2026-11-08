'use client';

import { Building2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export function StartupSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideSplash = () => {
      window.setTimeout(() => setVisible(false), 650);
    };

    if (document.readyState === 'complete') {
      hideSplash();
    } else {
      window.addEventListener('load', hideSplash, { once: true });
    }

    return () => window.removeEventListener('load', hideSplash);
  }, []);

  if (!visible) return null;

  return (
    <div className="startup-splash" role="status" aria-label="Loading Basha Vara">
      <div className="startup-splash__glow startup-splash__glow--one" />
      <div className="startup-splash__glow startup-splash__glow--two" />
      <div className="startup-splash__rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="startup-splash__content">
        <div className="startup-splash__logo">
          <Building2 strokeWidth={1.8} />
          <Sparkles className="startup-splash__sparkle" aria-hidden="true" />
        </div>
        <p className="startup-splash__brand">Basha Vara</p>
        <p className="startup-splash__tagline">Find your next place to belong</p>
        <div className="startup-splash__loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
