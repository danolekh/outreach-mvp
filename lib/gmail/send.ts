import "server-only"
import { google } from "googleapis"
import { createOAuth2Client, decrypt } from "./oauth"
import { db } from "@/lib/db"
import { gmailConnections } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function sendGmailEmail(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const [connection] = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, userId))
    .limit(1)

  if (!connection) throw new Error("No Gmail account connected")

  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    access_token: decrypt(connection.accessToken),
    refresh_token: decrypt(connection.refreshToken),
  })

  // Refresh if expiring within 5 minutes
  if (connection.tokenExpiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    if (credentials.access_token && credentials.expiry_date) {
      const { encrypt } = await import("./oauth")
      await db
        .update(gmailConnections)
        .set({
          accessToken: encrypt(credentials.access_token),
          tokenExpiresAt: new Date(credentials.expiry_date),
          updatedAt: new Date(),
        })
        .where(eq(gmailConnections.userId, userId))
    }
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2Client })

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\n")

  const encodedMessage = Buffer.from(message).toString("base64url")

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  })
}
