import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Get all notification templates
export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification templates' },
      { status: 500 }
    );
  }
}

// Create a new notification template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, title, body: content, is_active = true } = body;

    if (!name || !type || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notification_templates')
      .insert([
        {
          name,
          type,
          title,
          body: content,
          is_active,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating notification template:', error);
    return NextResponse.json(
      { error: 'Failed to create notification template' },
      { status: 500 }
    );
  }
}
