import { NextResponse } from 'next/server';
import { EmailTemplateType } from '@/lib/email/emailService';
import { sendServerEmail } from '@/lib/email/serverEmailService';

// Interface for email data
export interface EmailData {
  to: string;
  subject?: string;
  templateType: EmailTemplateType;
  variables: Record<string, string | number>;
}

export async function POST(request: Request) {
  try {
    const emailData: EmailData = await request.json();

    // Validate required fields
    if (!emailData.to || !emailData.templateType) {
      return NextResponse.json(
        { error: 'Missing required fields: to and templateType are required' },
        { status: 400 }
      );
    }

    // Send email using the server-side email service
    const result = await sendServerEmail({
      to: emailData.to,
      subject: emailData.subject,
      templateType: emailData.templateType,
      variables: emailData.variables || {},
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error('Error in email API route:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
