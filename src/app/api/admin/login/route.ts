import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, createAdminSessionToken } from "@/lib/adminSession";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Админ достъпът не е конфигуриран. Задай ADMIN_USERNAME, ADMIN_PASSWORD и ADMIN_SESSION_SECRET в environment променливите.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ success: false, error: "Невалидни данни." }, { status: 400 });
  }

  if (!safeEqual(body.username, adminUsername) || !safeEqual(body.password, adminPassword)) {
    return NextResponse.json({ success: false, error: "Грешно потребителско име или парола." }, { status: 401 });
  }

  const token = await createAdminSessionToken(adminUsername);
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
