import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Handle user registration and send welcome email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Register user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            role: 'customer',
          },
        ]);

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 400 }
        );
      }

      // Send welcome email using server-side email service
      try {
        const { sendServerEmail } = await import('@/lib/email/serverEmailService');

        await sendServerEmail({
          to: email,
          subject: 'Welcome to E-com',
          templateType: 'registration',
          variables: {
            first_name: firstName,
            last_name: lastName,
          },
        });

        console.log('Welcome email sent to:', email);

        // Notify admin about new registration
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('email')
          .eq('role', 'admin');

        if (!adminError && adminData && adminData.length > 0) {
          // Send email to all admins
          for (const admin of adminData) {
            await sendServerEmail({
              to: admin.email,
              subject: 'New User Registration',
              templateType: 'customer_signups',
              variables: {
                customer_name: `${firstName} ${lastName}`,
                customer_email: email,
                registration_date: new Date().toLocaleDateString(),
              },
            });

            console.log('Admin notification email sent to:', admin.email);
          }
        }
      } catch (emailError) {
        console.error('Error sending registration emails:', emailError);
        // Continue with registration even if email sending fails
      }

      return NextResponse.json({
        success: true,
        user: data.user,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create user',
    }, { status: 400 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
