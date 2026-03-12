export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

export function corsResponse(status = 200): Response {
  return new Response("ok", { status, headers: corsHeaders });
}

export function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(
  message: string,
  status = 500,
): Response {
  return jsonResponse({ error: message }, status);
}

export function binaryResponse(
  data: ArrayBuffer | Uint8Array,
  contentType: string,
): Response {
  return new Response(data, {
    headers: {
      ...corsHeaders,
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
