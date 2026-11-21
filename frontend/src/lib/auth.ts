import { createClient } from "@/lib/supabase/client";

/**
 * Returns the current session's JWT access token for authenticating API requests to the FastAPI backend.
 * Returns null if no active session exists.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }
    return session.access_token;
  } catch (err) {
    console.error("Error retrieving access token:", err);
    return null;
  }
}

/**
 * Returns the currently authenticated Supabase user, or null if not logged in.
 */
export async function getCurrentUser() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }
    return user;
  } catch (err) {
    console.error("Error retrieving current user:", err);
    return null;
  }
}
