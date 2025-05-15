import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Get user's FCM tokens from database
    const { data: tokens, error: tokenError } = await supabase
      .from('firebase_tokens')
      .select('token, created_at, device_info')
      .eq('user_id', userId);

    if (tokenError) {
      console.error('Error fetching FCM tokens:', tokenError);
      return NextResponse.json(
        { error: 'Error fetching FCM tokens', details: tokenError.message },
        { status: 500 }
      );
    }

    // Get notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get notification logs with error handling
    let logs = [];
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'push')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching notification logs:', error);
      } else {
        logs = data || [];
      }
    } catch (logsError) {
      console.error('Exception fetching notification logs:', logsError);
      // Continue execution even if logs fetch fails
    }

    // Prepare token data for response (mask actual tokens for security)
    const tokenData = tokens?.map(token => ({
      tokenId: token.token.substring(0, 10) + '...',
      created_at: token.created_at,
      device_info: token.device_info,
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        tokensCount: tokens?.length || 0,
        tokens: tokenData,
        pushEnabled: preferences?.push_enabled || false,
        preferences: preferences || null,
        recentLogs: logs,
      }
    });
  } catch (error: any) {
    console.error('Error checking Firebase token status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check Firebase token status' },
      { status: 500 }
    );
  }
}
