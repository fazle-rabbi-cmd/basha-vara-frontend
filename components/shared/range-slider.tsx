'use client';

import { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
}

export function RangeSlider({ min, max, step, value, onChange }: RangeSliderProps) {
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const percentage = (val: number) => ((val - min) / (max - min)) * 100;

  const updateValue = (clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newValue = min + percent * (max - min);
    const steppedValue = Math.round(newValue / step) * step;

    if (dragging === 'min') {
      onChange({ min: Math.min(steppedValue, value.max - step), max: value.max });
    } else {
      onChange({ min: value.min, max: Math.max(steppedValue, value.min + step) });
    }
  };

  const handleMouseDown = (handle: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(handle);
  };

  const handleTouchStart = (handle: 'min' | 'max') => (e: React.TouchEvent) => {
    e.preventDefault();
    setDragging(handle);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    updateValue(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragging) return;
    updateValue(e.touches[0].clientX);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleTouchEnd = () => {
    setDragging(null);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [dragging, value]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Min: {formatCurrency(value.min)}</span>
        <span className="text-muted-foreground">Max: {formatCurrency(value.max)}</span>
      </div>
      <div
        ref={sliderRef}
        className="relative h-2 bg-secondary rounded-lg cursor-pointer select-none"
      >
        {/* Track */}
        <div
          className="absolute h-full bg-primary rounded-lg"
          style={{
            left: `${percentage(value.min)}%`,
            right: `${100 - percentage(value.max)}%`,
          }}
        />
        {/* Min Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-primary border-2 border-background rounded-full cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 transition-transform"
          style={{ left: `${percentage(value.min)}%`, transform: 'translate(-50%, -50%)' }}
          onMouseDown={handleMouseDown('min')}
          onTouchStart={handleTouchStart('min')}
        />
        {/* Max Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-primary border-2 border-background rounded-full cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 transition-transform"
          style={{ left: `${percentage(value.max)}%`, transform: 'translate(-50%, -50%)' }}
          onMouseDown={handleMouseDown('max')}
          onTouchStart={handleTouchStart('max')}
        />
      </div>
    </div>
  );
}
