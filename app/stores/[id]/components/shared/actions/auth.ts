"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SignInFormValues, SignUpFormValues } from "@/app/stores/[id]/components/shared/lib/types";

export async function login(formData: SignInFormValues) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.session) {
    return { success: false, error: "Sign in successful but no session created." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // In our case we are not using a magic link URL, but receiving the 6 digit OTP.
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function verifyResetOtp(email: string, token: string) {
  const supabase = await createClient();

  // Verify the OTP directly as a 'recovery' type 
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Once the OTP is verified, the user session is authenticated. We can proceed to use updateUser
  return { success: true };
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Session remains active after password change by default in Supabase.
  revalidatePath("/settings");
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  
  // Check if current user is a demo user
  const { data: { user } } = await supabase.auth.getUser();
  const isDemo = user?.is_anonymous || user?.user_metadata?.source === "demo";

  if (isDemo) {
    console.log("Cleaning up demo store for user:", user?.id);
    await supabase.rpc("cleanup_my_demo_store");
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function checkSession() {
  const supabase = await createClient();
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return { success: false };
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    // Explicitly decode the token payload rather than trusting session.user
    if (session?.access_token) {
      try {
        const base64Url = session.access_token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Node.js safe base64 decoding
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
        const decodedPayload = JSON.parse(jsonPayload);
        
        if (decodedPayload?.app_metadata) {
          user.app_metadata = {
            ...user.app_metadata,
            ...decodedPayload.app_metadata,
          };
        }
      } catch (decodeError) {
        console.error("Failed to decode token on server:", decodeError);
      }
    }

    return { success: true, user };
  } catch (error) {
    return { success: false };
  }
}

// --- SIGN UP ---
export async function signUp(values: SignUpFormValues) {
  const supabase = await createClient();
  
  const { error: authError } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        source: "terminal",
        full_name: `${values.firstName} ${values.lastName}`,
        first_name: values.firstName,
        last_name: values.lastName,
        contact_email: values.email,
        job_title: values.jobTitle,
        enrollment_id: values.enrollmentId || null,
      },
    },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  return { success: true };
}


