import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { generatedEmails, gmailConnections } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { headers } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Zap, Plus } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const [emails, gmailConnection] = await Promise.all([
    db
      .select()
      .from(generatedEmails)
      .where(eq(generatedEmails.userId, session.user.id))
      .orderBy(desc(generatedEmails.createdAt)),
    db
      .select({ gmailEmail: gmailConnections.gmailEmail })
      .from(gmailConnections)
      .where(eq(gmailConnections.userId, session.user.id))
      .limit(1),
  ])

  const connection = gmailConnection[0] ?? null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground">
            {emails.length === 0
              ? "No emails generated yet. Create your first one."
              : `${emails.length} email${emails.length === 1 ? "" : "s"} generated`}
          </p>
        </div>
        <Link href="/generate">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Email
          </Button>
        </Link>
      </div>

      {!connection && (
        <Card className="border-dashed">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Gmail not connected</p>
              <p className="text-muted-foreground text-sm">
                Connect your Gmail account to send emails directly from your address.
              </p>
            </div>
            <Link href="/connect-gmail">
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                <Mail className="w-3.5 h-3.5" />
                Connect Gmail
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {emails.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 flex flex-col items-center text-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No emails yet</p>
              <p className="text-muted-foreground text-sm">
                Generate your first personalized outreach email with Claude AI.
              </p>
            </div>
            <Link href="/generate">
              <Button>Generate your first email</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => (
            <Link key={email.id} href={`/emails/${email.id}`} className="block">
            <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-sm font-medium leading-snug">
                    {email.subject}
                  </CardTitle>
                  <Badge
                    variant={email.sentAt ? "default" : "secondary"}
                    className="shrink-0 text-xs"
                  >
                    {email.sentAt ? "Sent" : "Draft"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Niche: {email.niche} · Target: {email.targetAudience}
                  {email.sentAt && email.sentTo && ` · Sent to ${email.sentTo}`}
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-3">
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                  {email.body}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(email.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
