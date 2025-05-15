import { NextResponse } from 'next/server';
import { sendServerEmail } from '@/lib/email/serverEmailService';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const templateType = url.searchParams.get('templateType') || 'order_status';
    
    // Validate required parameters
    if (!email) {
      return NextResponse.json(
        { error: 'Missing required parameter: email is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();
    
    // Check if the email template exists
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('type', templateType)
      .eq('is_active', true)
      .single();

    if (templateError) {
      console.error('Error fetching email template:', templateError);
      return NextResponse.json(
        { error: `Email template not found for type: ${templateType}` },
        { status: 404 }
      );
    }

    console.log('Found email template:', template.name);

    // Prepare test variables based on template type
    let variables: Record<string, string | number> = {
      first_name: 'Test',
      last_name: 'User',
    };

    if (templateType === 'order_status') {
      variables = {
        ...variables,
        order_id: 'TEST-123456',
        status: 'shipped',
        url: '/orders/TEST-123456',
      };
    } else if (templateType === 'order_placed') {
      variables = {
        ...variables,
        order_id: 'TEST-123456',
        order_total: '99.99',
        order_items: JSON.stringify([
          { name: 'Test Product 1', quantity: 2, price: 49.99 },
        ]),
      };
    }

    // Send test email
    console.log('Sending test email to:', email);
    console.log('Using template type:', templateType);
    console.log('With variables:', variables);

    const emailResult = await sendServerEmail({
      to: email,
      templateType: templateType as any,
      variables,
    });

    console.log('Email test result:', emailResult);

    // Check email logs
    const { data: logs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('recipient', email)
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.error('Error fetching email logs:', logsError);
    }

    return NextResponse.json({
      success: emailResult.success,
      message: emailResult.success 
        ? `Test email sent successfully to ${email}` 
        : `Failed to send test email: ${emailResult.error}`,
      result: emailResult,
      recentLogs: logs || [],
    });
  } catch (error: any) {
    console.error('Error testing email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test email' },
      { status: 500 }
    );
  }
}
