'use client';

import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { Skeleton } from '@/components/ui/skeleton';

interface CurrencyProps {
  value: number;
  className?: string;
}

export function Currency({ value, className = '' }: CurrencyProps) {
  const { formatCurrency, loading } = useCurrency();

  if (loading) {
    return <Skeleton className={`h-4 w-16 ${className}`} />;
  }

  return (
    <span className={className}>
      {formatCurrency(value)}
    </span>
  );
}

export function formatPrice(value: number): string {
  const { formatCurrency } = useCurrency();
  return formatCurrency(value);
}
