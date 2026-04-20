import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createOAuth2Client, encrypt } from "@/lib/gmail/oauth";
import { db } from "@/lib/db";
import { gmailConnections } from "@/lib/db/schema";
import { nanoid } from "nanoid";

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

    // Extract email from the ID token payload — no extra scope needed
    const idTokenPayload = tokens.id_token
      ? JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString())
      : null
    const gmailEmail: string | undefined = idTokenPayload?.email ?? session.user.email

    if (!gmailEmail) {
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
        gmailEmail,
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiresAt: expiresAt,
        scope: tokens.scope ?? "https://www.googleapis.com/auth/gmail.send",
      })
      .onConflictDoUpdate({
        target: gmailConnections.userId,
        set: {
          gmailEmail,
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
  } catch (err) {
    console.error("[gmail/callback] error:", err)
    const msg = err instanceof Error ? encodeURIComponent(err.message) : "unknown"
    return NextResponse.redirect(
      new URL(`/connect-gmail?error=exchange_failed&detail=${msg}`, req.url),
    );
  }
}
