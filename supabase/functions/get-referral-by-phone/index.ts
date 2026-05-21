import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const REFERRAL_ID_PATTERN = /^[A-Z]{3}\d{5}$/;

const LEVEL_TITLES: Record<number, string> = {
  0: "Non-User",
  1: "Experimenter",
  2: "Functional User",
  3: "Effective Practitioner",
  4: "AI-Native Performer",
  5: "AI-Native Builder",
  6: "Frontier Contributor",
};

function getLevelTitle(level: number | null | undefined): string | null {
  if (level == null || !Number.isInteger(level)) return null;
  return LEVEL_TITLES[level] ?? null;
}

/** Build normalized phone variants for lookup (stored as +91XXXXXXXXXX). */
function phoneLookupVariants(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const digitsOnly = trimmed.replace(/\D/g, "");
  const variants = new Set<string>();

  if (trimmed.startsWith("+")) {
    variants.add(trimmed.replace(/[\s-]/g, ""));
  }

  if (digitsOnly.length === 10) {
    variants.add(`+91${digitsOnly}`);
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    variants.add(`+${digitsOnly}`);
  } else if (digitsOnly.length > 10) {
    variants.add(`+${digitsOnly}`);
    if (digitsOnly.startsWith("91")) {
      variants.add(`+${digitsOnly}`);
    }
  }

  if (trimmed.startsWith("+")) {
    variants.add(trimmed.replace(/[\s-]/g, ""));
  }

  return [...variants].filter(Boolean);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await req.json();
    const phone = typeof body?.phone === "string" ? body.phone : "";

    if (!phone.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing required field: phone" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const variants = phoneLookupVariants(phone);
    if (variants.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("ai_level_assessments")
      .select("referral_id, user_phone, user_name, level, updated_at")
      .in("user_phone", variants)
      .not("referral_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Database lookup error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to look up referral ID" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!data?.referral_id || !REFERRAL_ID_PATTERN.test(data.referral_id)) {
      return new Response(
        JSON.stringify({
          found: false,
          referral_id: null,
          phone: variants[0] ?? phone,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        found: true,
        referral_id: data.referral_id,
        phone: data.user_phone,
        name: data.user_name ?? null,
        level_number: data.level ?? null,
        level_title: getLevelTitle(data.level),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("get-referral-by-phone error:", err);
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
