import { NextResponse } from "next/server";
import crypto from "crypto";

const hashSha256 = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  return crypto.createHash("sha256").update(normalized).digest("hex");
};

const hashPhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  return crypto.createHash("sha256").update(digits).digest("hex");
};

export async function POST(request) {
  try {
    const pixelId =
      process.env.NEXT_PUBLIC_META_PIXEL_ID ||
      process.env.META_PIXEL_ID ||
      "882439728193140";
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Missing META_CAPI_ACCESS_TOKEN on server" },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      eventName,
      eventId,
      eventSourceUrl,
      userData = {},
      customData = {},
      testEventCode,
    } = body;

    if (!eventName) {
      return NextResponse.json(
        { success: false, message: "eventName is required" },
        { status: 400 },
      );
    }

    // Extract network & browser identifiers from headers & cookies
    const forwarded = request.headers.get("x-forwarded-for");
    const cfIp = request.headers.get("cf-connecting-ip");
    const realIp = request.headers.get("x-real-ip");
    const clientIp =
      userData.client_ip_address ||
      cfIp ||
      (forwarded ? forwarded.split(",")[0].trim() : realIp);

    const userAgent =
      userData.client_user_agent || request.headers.get("user-agent");

    const cookieFbp = request.cookies.get("_fbp")?.value;
    const cookieFbc = request.cookies.get("_fbc")?.value;

    const fbp = userData.fbp || cookieFbp || null;
    const fbc = userData.fbc || cookieFbc || null;

    // Build user_data for Meta
    const normalizedUserData = {};
    if (clientIp) normalizedUserData.client_ip_address = clientIp;
    if (userAgent) normalizedUserData.client_user_agent = userAgent;
    if (fbp) normalizedUserData.fbp = fbp;
    if (fbc) normalizedUserData.fbc = fbc;

    const emailHash = hashSha256(userData.email || userData.em);
    if (emailHash) normalizedUserData.em = [emailHash];

    const phoneHash = hashPhone(userData.phone || userData.ph);
    if (phoneHash) normalizedUserData.ph = [phoneHash];

    const fnHash = hashSha256(userData.firstName || userData.fn);
    if (fnHash) normalizedUserData.fn = [fnHash];

    const lnHash = hashSha256(userData.lastName || userData.ln);
    if (lnHash) normalizedUserData.ln = [lnHash];

    const ctHash = hashSha256(userData.city || userData.ct);
    if (ctHash) normalizedUserData.ct = [ctHash];

    const stHash = hashSha256(userData.state || userData.st);
    if (stHash) normalizedUserData.st = [stHash];

    const zpHash = hashSha256(userData.zip || userData.zp || userData.postalCode);
    if (zpHash) normalizedUserData.zp = [zpHash];

    const country = userData.country || "us";
    const countryHash = hashSha256(country.slice(0, 2).toLowerCase());
    if (countryHash) normalizedUserData.country = [countryHash];

    if (userData.external_id) {
      const extHash = hashSha256(userData.external_id);
      if (extHash) normalizedUserData.external_id = [extHash];
    }

    const eventPayload = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url:
        eventSourceUrl ||
        request.headers.get("referer") ||
        "https://pretypet.com",
      user_data: normalizedUserData,
    };

    if (eventId) {
      eventPayload.event_id = String(eventId);
    }

    if (customData && Object.keys(customData).length > 0) {
      eventPayload.custom_data = customData;
    }

    const payload = {
      data: [eventPayload],
    };

    const activeTestCode =
      testEventCode || process.env.META_TEST_EVENT_CODE;
    if (activeTestCode) {
      payload.test_event_code = activeTestCode;
    }

    const metaUrl = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;
    const metaRes = await fetch(metaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      console.error("[Next.js Meta CAPI Route] Error response:", metaData);
      return NextResponse.json(
        { success: false, error: metaData?.error || metaData },
        { status: metaRes.status },
      );
    }

    return NextResponse.json({
      success: true,
      eventsReceived: metaData?.events_received,
      fbtraceId: metaData?.fbtrace_id,
    });
  } catch (error) {
    console.error("[Next.js Meta CAPI Route] Unexpected failure:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
