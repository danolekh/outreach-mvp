import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { getGmailAuthUrl } from "@/lib/gmail/oauth"
import { nanoid } from "nanoid"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const state = nanoid(32)
  const url = getGmailAuthUrl(state)

  const response = NextResponse.redirect(url)
  response.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  return response
}
