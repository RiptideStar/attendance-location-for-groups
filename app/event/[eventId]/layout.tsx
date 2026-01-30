import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ReactNode } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;

  try {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("title")
      .eq("id", eventId)
      .single();

    if (error || !data || typeof data.title !== "string") {
      return { title: "Check In" };
    }

    const title = `${data.title} — Check In`;
    return {
      title,
      openGraph: { title },
      twitter: { title },
    };
  } catch {
    return { title: "Check In" };
  }
}

export default async function EventLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
