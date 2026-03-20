import { NextRequest, NextResponse } from "next/server";

interface LumaEventData {
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  locationAddress: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
}

/**
 * Extract the event slug from a Luma URL.
 * Supports formats like:
 *   https://lu.ma/abc123
 *   https://lu.ma/event/evt-abc123
 *   lu.ma/abc123
 */
function extractLumaSlug(url: string): string | null {
  // Normalize: add https:// if missing
  let normalized = url.trim();
  if (!normalized.includes("://")) {
    normalized = "https://" + normalized;
  }

  try {
    const parsed = new URL(normalized);
    if (!parsed.hostname.endsWith("lu.ma")) {
      return null;
    }

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length === 0) {
      return null;
    }

    // /event/evt-xxx or just /slug
    if (pathParts[0] === "event" && pathParts[1]) {
      return pathParts[1];
    }
    return pathParts[0];
  } catch {
    return null;
  }
}

/**
 * Parse event data from __NEXT_DATA__ JSON embedded in the page HTML
 */
function parseNextData(html: string): LumaEventData | null {
  // Try __NEXT_DATA__ script tag
  const nextDataMatch = html.match(
    /<script\s+id="__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/
  );

  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const event = findEventInObject(nextData);
      if (event) return event;
    } catch {
      // Fall through to other methods
    }
  }

  // Try self.__next_f.push() flight data (newer Next.js)
  const flightChunks: string[] = [];
  const flightRegex = /self\.__next_f\.push\(\[[\d,]*"([\s\S]*?)"\]\)/g;
  let match;
  while ((match = flightRegex.exec(html)) !== null) {
    flightChunks.push(match[1]);
  }

  if (flightChunks.length > 0) {
    const combined = flightChunks.join("");
    // Look for JSON objects containing event data
    const jsonMatches = combined.match(/\{[^{}]*"name"[^{}]*"start_at"[^{}]*\}/g);
    if (jsonMatches) {
      for (const jsonStr of jsonMatches) {
        try {
          const obj = JSON.parse(jsonStr);
          const event = extractEventFields(obj);
          if (event) return event;
        } catch {
          // Continue trying
        }
      }
    }
  }

  return null;
}

/**
 * Recursively search an object for Luma event data
 */
function findEventInObject(obj: unknown): LumaEventData | null {
  if (!obj || typeof obj !== "object") return null;

  // Check if this object looks like a Luma event
  const record = obj as Record<string, unknown>;
  const event = extractEventFields(record);
  if (event) return event;

  // Recurse into object values
  const values = Array.isArray(obj) ? obj : Object.values(obj);
  for (const value of values) {
    const found = findEventInObject(value);
    if (found) return found;
  }

  return null;
}

/**
 * Extract event fields from an object that might be a Luma event
 */
function extractEventFields(
  obj: Record<string, unknown>
): LumaEventData | null {
  // Must have name and start_at at minimum
  if (!obj.name || !obj.start_at) return null;
  if (typeof obj.name !== "string" || typeof obj.start_at !== "string")
    return null;

  // Build location address from geo_address_info
  let locationAddress = "";
  const geoInfo = obj.geo_address_info as Record<string, string> | undefined;
  if (geoInfo) {
    locationAddress =
      geoInfo.full_address || geoInfo.address || geoInfo.description || "";
  }

  const latitude = obj.geo_latitude
    ? parseFloat(String(obj.geo_latitude))
    : null;
  const longitude = obj.geo_longitude
    ? parseFloat(String(obj.geo_longitude))
    : null;

  return {
    title: obj.name as string,
    startTime: obj.start_at as string,
    endTime: (obj.end_at as string) || "",
    locationAddress,
    latitude: latitude && !isNaN(latitude) ? latitude : null,
    longitude: longitude && !isNaN(longitude) ? longitude : null,
    timezone: (obj.timezone as string) || "",
  };
}

/**
 * Try fetching from Luma's internal API endpoint
 */
async function fetchFromLumaApi(
  slug: string
): Promise<LumaEventData | null> {
  try {
    const response = await fetch(
      `https://api.lu.ma/url?url=${encodeURIComponent(slug)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    // The response typically has the event data nested
    const event =
      data?.data?.event || data?.event || findEventInObject(data);
    if (event) return extractEventFields(event) || findEventInObject(data);
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A Luma URL is required" },
        { status: 400 }
      );
    }

    const slug = extractLumaSlug(url);
    if (!slug) {
      return NextResponse.json(
        { error: "Invalid Luma URL. Please provide a valid lu.ma event link." },
        { status: 400 }
      );
    }

    // Strategy 1: Try Luma's internal API
    let eventData = await fetchFromLumaApi(slug);

    // Strategy 2: Scrape the event page HTML
    if (!eventData) {
      try {
        const pageResponse = await fetch(`https://lu.ma/${slug}`, {
          headers: {
            Accept: "text/html",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          redirect: "follow",
        });

        if (pageResponse.ok) {
          const html = await pageResponse.text();
          eventData = parseNextData(html);
        }
      } catch {
        // Fall through to error
      }
    }

    if (!eventData) {
      return NextResponse.json(
        {
          error:
            "Could not fetch event data from Luma. Make sure the URL points to a valid public event.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(eventData);
  } catch (error) {
    console.error("Error importing Luma event:", error);
    return NextResponse.json(
      { error: "Failed to import event from Luma" },
      { status: 500 }
    );
  }
}
