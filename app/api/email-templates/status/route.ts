import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailTemplateType } from '@/lib/email/emailService';

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type') as EmailTemplateType;
    
    // Create Supabase client
    const supabase = createClient();
    
    // If type is provided, get specific template
    if (type) {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching email template:', error);
        return NextResponse.json(
          { error: `Email template not found for type: ${type}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        template: {
          id: data.id,
          name: data.name,
          type: data.type,
          subject: data.subject,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
          // Don't return the full body for security reasons
          body_preview: data.body.substring(0, 100) + '...',
        },
      });
    }
    
    // Otherwise, get all templates
    const { data, error } = await supabase
      .from('email_templates')
      .select('id, name, type, subject, is_active, created_at, updated_at')
      .order('type', { ascending: true });

    if (error) {
      console.error('Error fetching email templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email templates' },
        { status: 500 }
      );
    }

    // Get recent email logs
    const { data: logs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('Error fetching email logs:', logsError);
    }

    return NextResponse.json({
      success: true,
      templates: data,
      recentLogs: logs || [],
      templateTypes: [
        'order_placed',
        'registration',
        'order_status',
        'password_reset',
        'custom',
        'customer_signups',
      ],
    });
  } catch (error: any) {
    console.error('Error checking email template status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check email template status' },
      { status: 500 }
    );
  }
}
