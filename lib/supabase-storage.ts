import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getStorageBucket() {
  return requiredEnv("SUPABASE_STORAGE_BUCKET");
}

export function getSupabaseAdminClient() {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();

  if (!supabaseKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable."
    );
  }

  if (
    supabaseKey.startsWith("sb_publishable_") ||
    supabaseKey.startsWith("sb_public_") ||
    supabaseKey.startsWith("sb_publi")
  ) {
    throw new Error(
      "Supabase Storage uploads need a server-only secret/service_role key, not a publishable/anon key."
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function isPublicStorageBucket() {
  return process.env.SUPABASE_STORAGE_PUBLIC === "true";
}
