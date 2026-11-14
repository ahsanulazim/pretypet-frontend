export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
  "882439728193140";

/**
 * Helper to read cookie by name in browser
 */
const getBrowserCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Generate a unique event ID for Meta deduplication if none provided
 */
export const generateEventId = (prefix = "ev") => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Send event to Meta Conversions API (server-side via Next.js route)
 */
export const sendCapiEvent = async (
  name,
  customData = {},
  eventId = null,
  userData = {},
) => {
  if (typeof window === "undefined") return;

  try {
    const fbp = getBrowserCookie("_fbp");
    const fbc = getBrowserCookie("_fbc");

    const payload = {
      eventName: name,
      eventId: eventId || undefined,
      eventSourceUrl: window.location.href,
      userData: {
        ...userData,
        fbp: userData.fbp || fbp || undefined,
        fbc: userData.fbc || fbc || undefined,
      },
      customData: customData || {},
    };

    fetch("/api/meta-capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true, // keeps fetch alive even if user navigates away
    }).catch((err) => {
      console.warn("[Meta CAPI Client Dispatch Warning]:", err?.message);
    });
  } catch (error) {
    console.warn("[Meta CAPI Dispatch Error]:", error?.message);
  }
};

/**
 * Track standard PageView (Pixel + CAPI)
 */
export const pageview = (eventId = null) => {
  if (typeof window !== "undefined") {
    const finalEventId = eventId || generateEventId("pv");

    if (window.fbq) {
      window.fbq("track", "PageView", {}, { eventID: finalEventId });
    }

    sendCapiEvent("PageView", {}, finalEventId);
  }
};

/**
 * Track standard Meta event (Deduplicated Pixel + CAPI)
 * @param {string} name - Standard event name (e.g. ViewContent, AddToCart, InitiateCheckout, Purchase)
 * @param {object} options - Event parameters (custom_data)
 * @param {string|null} eventId - Unique ID for deduplication (matches CAPI & Pixel)
 * @param {object} userData - Customer data for higher Match Quality (email, phone, name, etc.)
 */
export const event = (
  name,
  options = {},
  eventId = null,
  userData = {},
) => {
  if (typeof window === "undefined") return;

  const finalEventId = eventId || generateEventId(name.toLowerCase());

  // 1. Browser Meta Pixel
  if (window.fbq) {
    window.fbq("track", name, options, { eventID: finalEventId });
  }

  // 2. Server-side Conversions API (CAPI)
  sendCapiEvent(name, options, finalEventId, userData);

  return finalEventId;
};

/**
 * Track custom Meta Pixel event
 * @param {string} name - Custom event name
 * @param {object} options - Event parameters
 * @param {string|null} eventId - Unique ID for deduplication
 * @param {object} userData - Customer data
 */
export const customEvent = (
  name,
  options = {},
  eventId = null,
  userData = {},
) => {
  if (typeof window === "undefined") return;

  const finalEventId = eventId || generateEventId(name.toLowerCase());

  if (window.fbq) {
    window.fbq("trackCustom", name, options, { eventID: finalEventId });
  }

  sendCapiEvent(name, options, finalEventId, userData);

  return finalEventId;
};
