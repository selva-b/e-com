import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    console.log('Testing admin client...');
    
    // Get the admin client
    const adminClient = getAdminClient();
    
    // Test a simple query
    const { data, error } = await adminClient
      .from('products')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('Error testing admin client:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to test admin client' },
        { status: 500 }
      );
    }
    
    console.log('Admin client test successful:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Admin client is working correctly',
      data,
    });
  } catch (error: any) {
    console.error('Error testing admin client:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test admin client' },
      { status: 500 }
    );
  }
}
