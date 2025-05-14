import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/notifications/notificationService';
import { supabase } from '@/lib/supabase/client';

// Send notification to a user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, body: content, type, data, email = true, push = true } = body;

    if (!userId || !title || !content || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send notification
    const result = await sendNotification({
      userId,
      title,
      body: content,
      type,
      data,
      email,
      push,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
