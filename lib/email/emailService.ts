import { supabase } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

// Email template types
export type EmailTemplateType = 'order_placed' | 'registration' | 'order_status' | 'password_reset' | 'custom' | 'customer_signups';

// Interface for email data
export interface EmailData {
  to: string;
  subject: string;
  templateType: EmailTemplateType;
  variables: Record<string, string | number>;
  supabaseClient?: SupabaseClient; // Optional Supabase client for server-side operations
}

// Function to get email template from database
export const getEmailTemplate = async (templateType: EmailTemplateType, client?: SupabaseClient) => {
  try {
    // Use provided client or fallback to default client
    const db = client || supabase;

    const { data, error } = await db
      .from('email_templates')
      .select('*')
      .eq('type', templateType)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching email template:', error);
    return null;
  }
};

// Function to replace variables in template
export const replaceTemplateVariables = (template: string, variables: Record<string, string | number>) => {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }

  return result;
};

// Send email function
export const sendEmail = async (emailData: EmailData) => {
  try {
    // Use the API route to send emails
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email');
    }

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};
