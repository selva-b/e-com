'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface FlashSaleTimerProps {
  className?: string;
}

export default function FlashSaleTimer({ className = '' }: FlashSaleTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNextEndingFlashSale() {
      try {
        // Get the current date
        const now = new Date();
        
        // Fetch flash sale products with end dates in the future
        const { data, error } = await supabase
          .from('products')
          .select('sale_end_date')
          .eq('is_on_sale', true)
          .gt('sale_end_date', now.toISOString())
          .order('sale_end_date', { ascending: true })
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0 && data[0].sale_end_date) {
          setEndDate(new Date(data[0].sale_end_date));
        } else {
          // If no active flash sales, set a default end date 24 hours from now
          const defaultEndDate = new Date();
          defaultEndDate.setHours(defaultEndDate.getHours() + 24);
          setEndDate(defaultEndDate);
        }
      } catch (error) {
        console.error('Error fetching flash sale end date:', error);
        // Set a default end date
        const defaultEndDate = new Date();
        defaultEndDate.setHours(defaultEndDate.getHours() + 24);
        setEndDate(defaultEndDate);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNextEndingFlashSale();
  }, []);
  
  useEffect(() => {
    if (!endDate) return;
    
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };
    
    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    // Clean up
    return () => clearInterval(timer);
  }, [endDate]);
  
  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="h-4 w-4 text-red-600" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="h-4 w-4 text-red-600" />
      <div className="flex gap-1 text-sm font-medium">
        <div className="flex flex-col items-center bg-white dark:bg-gray-800 px-2 py-1 rounded-md">
          <span className="text-lg font-bold">{timeLeft.days}</span>
          <span className="text-xs text-gray-500">days</span>
        </div>
        <span className="self-center">:</span>
        <div className="flex flex-col items-center bg-white dark:bg-gray-800 px-2 py-1 rounded-md">
          <span className="text-lg font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span>
          <span className="text-xs text-gray-500">hrs</span>
        </div>
        <span className="self-center">:</span>
        <div className="flex flex-col items-center bg-white dark:bg-gray-800 px-2 py-1 rounded-md">
          <span className="text-lg font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="text-xs text-gray-500">mins</span>
        </div>
        <span className="self-center">:</span>
        <div className="flex flex-col items-center bg-white dark:bg-gray-800 px-2 py-1 rounded-md">
          <span className="text-lg font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="text-xs text-gray-500">secs</span>
        </div>
      </div>
    </div>
  );
}
