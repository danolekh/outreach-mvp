import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createOAuth2Client, encrypt } from "@/lib/gmail/oauth";
import { db } from "@/lib/db";
import { gmailConnections } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("gmail_oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/connect-gmail?error=invalid_state", req.url),
    );
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/connect-gmail?error=missing_tokens", req.url),
      );
    }

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email) {
      return NextResponse.redirect(
        new URL("/connect-gmail?error=no_email", req.url),
      );
    }

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    await db
      .insert(gmailConnections)
      .values({
        id: nanoid(),
        userId: session.user.id,
        gmailEmail: userInfo.email,
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiresAt: expiresAt,
        scope: tokens.scope ?? "https://www.googleapis.com/auth/gmail.send",
      })
      .onConflictDoUpdate({
        target: gmailConnections.userId,
        set: {
          gmailEmail: userInfo.email,
          accessToken: encrypt(tokens.access_token),
          refreshToken: encrypt(tokens.refresh_token),
          tokenExpiresAt: expiresAt,
          updatedAt: new Date(),
        },
      });

    const response = NextResponse.redirect(
      new URL("/connect-gmail?success=true", req.url),
    );
    response.cookies.delete("gmail_oauth_state");
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/connect-gmail?error=exchange_failed", req.url),
    );
  }
}
