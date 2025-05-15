'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { onMessageListener } from '@/lib/firebase/firebaseInit';
import { useToast } from '@/hooks/use-toast';

type NotificationContextType = {
  showNotification: (title: string, body: string, data?: any) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Function to show a notification
  const showNotification = (title: string, body: string, data?: any) => {
    // Show toast notification
    toast({
      title,
      description: body,
      duration: 5000,
    });

    // If browser notifications are supported and permission is granted, show a browser notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        // Create and show browser notification
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          data,
        });

        // Handle notification click
        notification.onclick = (event) => {
          event.preventDefault();

          // If there's a URL in the data, navigate to it
          if (data?.url) {
            window.open(data.url, '_blank');
          }

          // Focus on the window
          window.focus();

          // Close the notification
          notification.close();
        };
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }
  };

  // Listen for Firebase messages when the component mounts
  useEffect(() => {
    if (!user) return;

    let unsubscribeFunction: (() => void) | null = null;

    // Set up Firebase message listener
    const setupMessageListener = async () => {
      try {
        // onMessageListener returns a Promise that resolves to the unsubscribe function
        const unsubscribe = await onMessageListener();
        unsubscribeFunction = unsubscribe;

        // The actual message handling is done inside onMessageListener
        // We just need to store the unsubscribe function
      } catch (error) {
        console.error('Error setting up message listener:', error);
      }
    };

    setupMessageListener();

    // Clean up the listener when the component unmounts
    return () => {
      if (typeof unsubscribeFunction === 'function') {
        unsubscribeFunction();
      }
    };
  }, [user]);

  const value = {
    showNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
