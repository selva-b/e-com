import { NextResponse } from 'next/server';

// Configure for static export
export const dynamic = 'force-static';

export async function GET(request: Request) {
  // Redirect /category to /categories
  return NextResponse.redirect(new URL('/categories', request.url));
}
