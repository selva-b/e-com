import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@/lib/supabase/server';

// Email template types
export type EmailTemplateType = 'order_placed' | 'registration' | 'order_status' | 'password_reset' | 'custom';

// Interface for email data
export interface EmailData {
  to: string;
  subject: string;
  templateType: EmailTemplateType;
  variables: Record<string, string | number>;
}

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

// Function to get email template from database
const getEmailTemplate = async (templateType: EmailTemplateType) => {
  try {
    const supabase = createClient();
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
const replaceTemplateVariables = (template: string, variables: Record<string, string | number>) => {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }
  
  return result;
};

export async function POST(request: Request) {
  try {
    const emailData: EmailData = await request.json();
    
    // Get template from database
    const template = await getEmailTemplate(emailData.templateType);
    
    if (!template) {
      return NextResponse.json(
        { error: `Email template not found for type: ${emailData.templateType}` },
        { status: 404 }
      );
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
    const supabase = createClient();
    await supabase.from('email_logs').insert([
      {
        recipient: emailData.to,
        subject,
        template_type: emailData.templateType,
        status: 'sent',
        message_id: info.messageId,
      },
    ]);
    
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Log failed email attempt
    try {
      const supabase = createClient();
      await supabase.from('email_logs').insert([
        {
          recipient: (error.emailData?.to || 'unknown'),
          subject: (error.emailData?.subject || 'unknown'),
          template_type: (error.emailData?.templateType || 'unknown'),
          status: 'failed',
          error_message: error.message,
        },
      ]);
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
