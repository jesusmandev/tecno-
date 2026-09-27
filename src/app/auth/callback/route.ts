import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://loytxdzobuqpemjxhnza.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "sb_publishable_d6_rrLaq6L4It5JuRavq0g_1L-S8RNQ";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error("Error exchanging OAuth code for session:", err);
    }
  }

  // Redirigir a la página de origen limpia
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
