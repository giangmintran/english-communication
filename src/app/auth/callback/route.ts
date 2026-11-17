import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Handle potential error returned from provider in URL
  const errorDescription = searchParams.get('error_description') || searchParams.get('error');
  if (errorDescription) {
    console.error('OAuth provider error:', errorDescription);
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(errorDescription)}`);
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const redirectUrl = isLocalEnv
        ? `${origin}${next}`
        : forwardedHost
        ? `https://${forwardedHost}${next}`
        : `${origin}${next}`;

      // CRITICAL: The redirect response MUST be created first so that Set-Cookie headers
      // written by exchangeCodeForSession are attached directly to this redirect response!
      const response = NextResponse.redirect(redirectUrl);

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return response;
      }
      console.error('Supabase exchangeCodeForSession error:', error.message);
    }
  }

  // Redirect back to home with error parameter
  return NextResponse.redirect(`${origin}/?auth_error=could_not_authenticate`);
}
