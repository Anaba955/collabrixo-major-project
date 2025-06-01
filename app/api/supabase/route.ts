import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if admin is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Execute the SQL command to add the public_url column
    const { error } = await supabase.rpc('add_public_url_column');
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Added public_url column to profiles table' });
  } catch (error) {
    console.error('Error adding column:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if admin is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create the stored procedure for adding the column if it doesn't exist
    await supabase.rpc('create_add_public_url_procedure');
    
    return NextResponse.json({ success: true, message: 'Created stored procedure' });
  } catch (error) {
    console.error('Error creating procedure:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 