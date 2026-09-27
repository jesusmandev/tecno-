import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

// GET: Consultar perfil por user_id o email
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json(
        { error: "Se requiere userId o email para buscar el perfil." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ profile: null, source: "none" });
    }

    const admin = getSupabaseAdmin();
    let query = admin.from("customer_profiles").select("*");

    if (userId) {
      query = query.eq("id", userId);
    } else if (email) {
      query = query.eq("email", email);
    }

    const { data, error } = await query.single();

    if (error) {
      return NextResponse.json({ profile: null, error: error.message });
    }

    return NextResponse.json({ profile: data, source: "supabase" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener perfil";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Crear o actualizar perfil de cliente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, email, full_name, phone, document_id, shipping_address, city, department, address_notes, avatar_url } = body;

    if (!id && !email) {
      return NextResponse.json(
        { error: "Se requiere id o email para guardar el perfil." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, source: "local_memory" });
    }

    const admin = getSupabaseAdmin();
    const profileData = {
      id,
      email,
      full_name,
      phone: phone || null,
      document_id: document_id || null,
      shipping_address: shipping_address || null,
      city: city || "Montería",
      department: department || "Córdoba",
      address_notes: address_notes || null,
      avatar_url: avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from("customer_profiles")
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      console.warn("Supabase upsert profile error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al guardar perfil";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
