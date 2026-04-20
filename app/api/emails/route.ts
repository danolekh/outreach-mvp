import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { generatedEmails } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const emails = await db
    .select()
    .from(generatedEmails)
    .where(eq(generatedEmails.userId, session.user.id))
    .orderBy(desc(generatedEmails.createdAt))

  return NextResponse.json(emails)
}
