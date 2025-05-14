import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Get all email templates
export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

// Create a new email template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, subject, body: content, is_active = true } = body;

    if (!name || !type || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('email_templates')
      .insert([
        {
          name,
          type,
          subject,
          body: content,
          is_active,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}
