import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
  return res;
}
