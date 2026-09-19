import { NextResponse } from "next/server";

export function importUnauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export function assertLocalImportAllowed(request: Request) {
  const secret = process.env.IMPORT_SECRET?.trim();
  if (!secret) {
    return {
      allowed: false as const,
      response: NextResponse.json(
        {
          ok: false,
          error:
            "IMPORT_SECRET is not set. Add it to .env.local for local imports.",
        },
        { status: 503 },
      ),
    };
  }

  const provided = request.headers.get("x-import-secret");
  if (provided !== secret) {
    return { allowed: false as const, response: importUnauthorized() };
  }

  const allowProd =
    process.env.ALLOW_LOCAL_IMPORT === "true" ||
    process.env.ALLOW_CASHFLOW_IMPORT === "true";

  if (process.env.NODE_ENV === "production" && !allowProd) {
    return {
      allowed: false as const,
      response: NextResponse.json(
        {
          ok: false,
          error:
            "Local import is disabled in production. Set ALLOW_LOCAL_IMPORT=true only if you intend to run imports there.",
        },
        { status: 403 },
      ),
    };
  }

  return { allowed: true as const };
}
