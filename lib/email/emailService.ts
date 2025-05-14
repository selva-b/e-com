import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase/client';

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Email template types
export type EmailTemplateType = 'order_placed' | 'registration' | 'order_status' | 'password_reset' | 'custom';

// Interface for email data
export interface EmailData {
  to: string;
  subject: string;
  templateType: EmailTemplateType;
  variables: Record<string, string | number>;
}

// Function to get email template from database
export const getEmailTemplate = async (templateType: EmailTemplateType) => {
  try {
    const { data, error } = await supabase
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
    // Get template from database
    const template = await getEmailTemplate(emailData.templateType);
    
    if (!template) {
      throw new Error(`Email template not found for type: ${emailData.templateType}`);
    }
    
    // Replace variables in subject and body
    const subject = replaceTemplateVariables(template.subject, emailData.variables);
    const html = replaceTemplateVariables(template.body, emailData.variables);
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"E-com Store" <noreply@e-com.com>',
      to: emailData.to,
      subject,
      html,
    });
    
    console.log('Email sent:', info.messageId);
    
    // Log email in database
    await supabase.from('email_logs').insert([
      {
        recipient: emailData.to,
        subject,
        template_type: emailData.templateType,
        status: 'sent',
        message_id: info.messageId,
      },
    ]);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log failed email attempt
    await supabase.from('email_logs').insert([
      {
        recipient: emailData.to,
        subject: emailData.subject,
        template_type: emailData.templateType,
        status: 'failed',
        error_message: error.message,
      },
    ]);
    
    return { success: false, error };
  }
};
