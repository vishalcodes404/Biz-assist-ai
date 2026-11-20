import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { UserRole } from "@/types";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  // Determine origin safely across localhost, Vercel preview, and production deployments
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: Array<{
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }>
          ) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Can be ignored in Server Route
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;

      // 1. Check whether profile already exists in public.profiles table
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      const isAdminEmail =
        user.email?.toLowerCase() === "vishal123@admin.in" ||
        user.email?.toLowerCase().includes("@admin.") ||
        user.email?.toLowerCase().startsWith("admin@");

      let targetRole: UserRole = isAdminEmail ? "admin" : "customer";

      if (!existingProfile) {
        // 2. First-time login: create new profile row for this Google ID
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          (isAdminEmail ? "Vishal (Admin)" : "Customer");
        const avatarUrl =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null;

        const newProfile = {
          id: user.id,
          full_name: fullName,
          email: user.email || "",
          role: isAdminEmail ? ("admin" as UserRole) : ("customer" as UserRole),
          avatar_url: avatarUrl,
        };

        await supabase.from("profiles").upsert(newProfile);

        // Also add a welcome notification
        try {
          await supabase.from("notifications").insert({
            user_id: user.id,
            ticket_id: null,
            message: `Welcome to BizAssist AI, ${fullName}! Your ${isAdminEmail ? "Admin" : "Customer"} account is ready.`,
          });
        } catch {
          // Non-blocking notification
        }
      } else {
        if (isAdminEmail && existingProfile.role !== "admin") {
          await supabase
            .from("profiles")
            .update({ role: "admin" })
            .eq("id", user.id);
          targetRole = "admin";
        } else {
          targetRole = (existingProfile.role as UserRole) || "customer";
        }
      }

      // If user specified an explicit destination (e.g. ?next=...), honor it
      if (next && next.startsWith("/")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise redirect directly to their role-specific dashboard
      switch (targetRole) {
        case "admin":
          return NextResponse.redirect(`${origin}/admin/dashboard`);
        case "staff":
          return NextResponse.redirect(`${origin}/staff/dashboard`);
        case "customer":
        default:
          return NextResponse.redirect(`${origin}/customer/dashboard`);
      }
    }
  }

  // If code exchange failed or no code provided, redirect to login with query param
  return NextResponse.redirect(`${origin}/login?error=oauth_error`);
}
