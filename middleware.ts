import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Handle /category/:slug URLs
  if (pathname.startsWith('/category/')) {
    // Extract the slug from the URL
    const slug = pathname.replace('/category/', '');
    
    // Redirect to the new categories format
    url.pathname = `/categories/${slug}`;
    
    return NextResponse.redirect(url);
  }
  
  // Handle /category?slug=xyz URLs
  if (pathname === '/category' && url.searchParams.has('slug')) {
    const slug = url.searchParams.get('slug');
    
    // Redirect to the new categories format
    url.pathname = `/categories/${slug}`;
    url.searchParams.delete('slug');
    
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure the middleware to only run on specific paths
export const config = {
  matcher: ['/category/:path*', '/category'],
};
