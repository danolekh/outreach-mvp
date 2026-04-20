import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { generateOutreachEmail } from "@/lib/ai/generate-email"
import { db } from "@/lib/db"
import { generatedEmails } from "@/lib/db/schema"
import { nanoid } from "nanoid"
import { z } from "zod"

const schema = z.object({
  niche: z.string().min(2).max(200),
  targetAudience: z.string().min(2).max(200),
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

  const { niche, targetAudience } = parsed.data

  const result = await generateOutreachEmail(niche, targetAudience)

  const id = nanoid()
  await db.insert(generatedEmails).values({
    id,
    userId: session.user.id,
    niche,
    targetAudience,
    subject: result.subject,
    body: result.body,
    previewText: result.previewText,
  })

  return NextResponse.json({ id, ...result })
}
