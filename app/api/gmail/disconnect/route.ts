import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { gmailConnections } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await db.delete(gmailConnections).where(eq(gmailConnections.userId, session.user.id))

  return NextResponse.json({ success: true })
}
