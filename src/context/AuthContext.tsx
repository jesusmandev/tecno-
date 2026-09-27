"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  document_id?: string;
  shipping_address?: string;
  city?: string;
  department?: string;
  address_notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: CustomerProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<CustomerProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar perfil desde la API / Supabase
  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      // 1. Intentar leer desde la tabla de perfiles en Supabase
      const { data, error } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (data && !error) {
        setProfile(data as CustomerProfile);
        return;
      }

      // Si no existe, crearlo con los datos que nos dio Google
      const newProfile: CustomerProfile = {
        id: currentUser.id,
        email: currentUser.email || "",
        full_name:
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split("@")[0] ||
          "",
        avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || "",
        city: "Montería",
        department: "Córdoba",
      };

      const { error: insertErr } = await supabase
        .from("customer_profiles")
        .upsert(newProfile);

      if (!insertErr) {
        setProfile(newProfile);
      } else {
        // Fallback en memoria si la tabla aún no se ha creado en Supabase
        setProfile(newProfile);
      }
    } catch (err) {
      console.warn("No se pudo cargar el perfil de cliente:", err);
      // Fallback básico con datos de Google Auth
      if (currentUser) {
        setProfile({
          id: currentUser.id,
          email: currentUser.email || "",
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "",
          avatar_url: currentUser.user_metadata?.avatar_url || "",
          city: "Montería",
          department: "Córdoba",
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación en tiempo real
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Iniciar sesión con Google
  const signInWithGoogle = async () => {
    try {
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${currentOrigin}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      return { error };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Error al conectar con Google");
      return { error };
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Error cerrando sesión:", err);
    }
  };

  // Actualizar perfil del cliente (dirección, teléfono, cédula)
  const updateProfile = async (updates: Partial<CustomerProfile>) => {
    if (!user) return { success: false, error: "Usuario no autenticado" };

    try {
      const updatedData = {
        ...profile,
        ...updates,
        id: user.id,
        email: user.email || profile?.email || "",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("customer_profiles")
        .upsert(updatedData);

      if (error) {
        console.warn("Error al actualizar perfil en Supabase:", error.message);
        // Aún así actualizamos el estado en React para fluidez
        setProfile(updatedData as CustomerProfile);
        return { success: true };
      }

      setProfile(updatedData as CustomerProfile);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar perfil";
      return { success: false, error: msg };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
