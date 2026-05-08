"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function login(formData: FormData) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
    },
  });

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
    },
  });

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?registered=true");
}

export async function logout() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
    },
  });

  await supabase.auth.signOut();
  redirect("/login");
}
