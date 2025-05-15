'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface CurrencySettings {
  code: string;
  symbol: string;
  position: 'before' | 'after';
  decimalSeparator: string;
  thousandSeparator: string;
  decimalPlaces: number;
}

interface CurrencyContextType {
  settings: CurrencySettings;
  loading: boolean;
  formatCurrency: (amount: number) => string;
  updateSettings: (newSettings: Partial<CurrencySettings>) => Promise<void>;
}

// Default settings
const defaultSettings: CurrencySettings = {
  code: 'INR',
  symbol: '₹',
  position: 'before',
  decimalSeparator: '.',
  thousandSeparator: ',',
  decimalPlaces: 2,
};

const CurrencyContext = createContext<CurrencyContextType>({
  settings: defaultSettings,
  loading: true,
  formatCurrency: () => '',
  updateSettings: async () => {},
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CurrencySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data: currencyCode } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'currency_code')
        .single();
      
      const { data: currencySymbol } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'currency_symbol')
        .single();
      
      const { data: currencyPosition } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'currency_position')
        .single();
      
      const { data: decimalSeparator } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'decimal_separator')
        .single();
      
      const { data: thousandSeparator } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'thousand_separator')
        .single();
      
      const { data: decimalPlaces } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'decimal_places')
        .single();
      
      // If we have settings in the database, use them
      if (currencyCode && currencySymbol && currencyPosition && 
          decimalSeparator && thousandSeparator && decimalPlaces) {
        setSettings({
          code: currencyCode.value,
          symbol: currencySymbol.value,
          position: currencyPosition.value as 'before' | 'after',
          decimalSeparator: decimalSeparator.value,
          thousandSeparator: thousandSeparator.value,
          decimalPlaces: parseInt(decimalPlaces.value, 10),
        });
      }
    } catch (error) {
      console.error('Error fetching currency settings:', error);
      // If there's an error, we'll use the default settings
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<CurrencySettings>) => {
    try {
      setLoading(true);
      
      // Update settings in the database
      const updates = [];
      
      if (newSettings.code !== undefined) {
        updates.push(supabase
          .from('settings')
          .update({ value: newSettings.code, updated_at: new Date().toISOString() })
          .eq('key', 'currency_code'));
      }
      
      if (newSettings.symbol !== undefined) {
        updates.push(supabase
          .from('settings')
          .update({ value: newSettings.symbol, updated_at: new Date().toISOString() })
          .eq('key', 'currency_symbol'));
      }
      
      if (newSettings.position !== undefined) {
        updates.push(supabase
          .from('settings')
          .update({ value: newSettings.position, updated_at: new Date().toISOString() })
          .eq('key', 'currency_position'));
      }
      
      if (newSettings.decimalSeparator !== undefined) {
        updates.push(supabase
          .from('settings')
          .update({ value: newSettings.decimalSeparator, updated_at: new Date().toISOString() })
          .eq('key', 'decimal_separator'));
      }
      
      if (newSettings.thousandSeparator !== undefined) {
        updates.push(supabase
          .from('settings')
          .update({ value: newSettings.thousandSeparator, updated_at: new Date().toISOString() })
          .eq('key', 'thousand_separator'));
      }
      
      if (newSettings.decimalPlaces !== undefined) {
        updates.push(supabase
          .from('settings')
          .update({ value: newSettings.decimalPlaces.toString(), updated_at: new Date().toISOString() })
          .eq('key', 'decimal_places'));
      }
      
      await Promise.all(updates);
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        ...newSettings,
      }));
    } catch (error) {
      console.error('Error updating currency settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    try {
      // Format the number with the specified decimal places
      const formattedNumber = amount.toFixed(settings.decimalPlaces);
      
      // Split the number into integer and decimal parts
      const [integerPart, decimalPart] = formattedNumber.split('.');
      
      // Add thousand separators to the integer part
      const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, settings.thousandSeparator);
      
      // Combine the parts with the decimal separator
      const formattedAmount = decimalPart 
        ? `${formattedIntegerPart}${settings.decimalSeparator}${decimalPart}`
        : formattedIntegerPart;
      
      // Add the currency symbol in the correct position
      return settings.position === 'before'
        ? `${settings.symbol}${formattedAmount}`
        : `${formattedAmount}${settings.symbol}`;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${settings.symbol}${amount}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ settings, loading, formatCurrency, updateSettings }}>
      {children}
    </CurrencyContext.Provider>
  );
};
