import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Upsert a location for an organization.
 * Called from event creation routes as a fire-and-forget side effect.
 * If the location already exists (same org + lat/lng), updates last_used_at
 * and increments use_count atomically via a Postgres function.
 */
export function upsertOrganizationLocation(
  organizationId: string,
  address: string,
  lat: number,
  lng: number
): void {
  Promise.resolve(
    supabaseAdmin.rpc("upsert_organization_location", {
      p_organization_id: organizationId,
      p_label: address,
      p_address: address,
      p_lat: lat,
      p_lng: lng,
    })
  ).catch((err: unknown) => {
    console.error("Failed to upsert organization location:", err);
  });
}
