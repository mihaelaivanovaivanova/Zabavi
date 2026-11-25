import { NextResponse, connection } from "next/server";
import { reviewRepository } from "@/infrastructure/repositories/reviewRepository";

/** Gated by proxy.ts — only reachable with a valid admin session cookie. */
export async function GET() {
  await connection();
  const reviews = await reviewRepository.findAll();
  return NextResponse.json({ reviews });
}
