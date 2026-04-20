import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { sendGmailEmail } from "@/lib/gmail/send"
import { db } from "@/lib/db"
import { generatedEmails } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const schema = z.object({
  emailId: z.string(),
  toAddress: z.string().email(),
})

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { emailId, toAddress } = parsed.data

  const [email] = await db
    .select()
    .from(generatedEmails)
    .where(and(eq(generatedEmails.id, emailId), eq(generatedEmails.userId, session.user.id)))
    .limit(1)

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 })
  }

  await sendGmailEmail(session.user.id, toAddress, email.subject, email.body)

  await db
    .update(generatedEmails)
    .set({ sentAt: new Date(), sentTo: toAddress })
    .where(eq(generatedEmails.id, emailId))

  return NextResponse.json({ success: true })
}
