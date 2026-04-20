"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Copy, Send, Mail, CheckCircle } from "lucide-react"

type Email = {
  id: string
  niche: string
  targetAudience: string
  subject: string
  body: string
  previewText: string
  sentAt: Date | null
  sentTo: string | null
  createdAt: Date
}

export function EmailDetailClient({
  email,
  gmailEmail,
}: {
  email: Email
  gmailEmail: string | null
}) {
  const router = useRouter()
  const [toAddress, setToAddress] = useState(email.sentTo ?? "")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(!!email.sentAt)

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`)
    toast.success("Copied to clipboard")
  }

  async function handleSend() {
    if (!toAddress) return
    setSending(true)
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId: email.id, toAddress }),
    })
    if (res.ok) {
      toast.success(`Email sent to ${toAddress}`)
      setSent(true)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "Failed to send email")
    }
    setSending(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-snug">{email.subject}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {email.niche} · {email.targetAudience}
          </p>
        </div>
        <Badge variant={sent ? "default" : "secondary"} className="shrink-0 mt-1">
          {sent ? "Sent" : "Draft"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Mail className="w-4 h-4" />
            Email Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Subject</p>
            <p className="font-medium">{email.subject}</p>
          </div>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Body</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{email.body}</p>
          </div>
        </CardContent>
      </Card>

      {sent && email.sentTo ? (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">Email sent</p>
              <p className="text-xs text-muted-foreground">
                Delivered to {email.sentTo} on{" "}
                {email.sentAt
                  ? new Date(email.sentAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          <Copy className="w-3.5 h-3.5" />
          Copy email
        </Button>
        <Link href="/generate">
          <Button variant="outline" size="sm">Generate another</Button>
        </Link>
      </div>

      {!sent && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            {gmailEmail ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Send via <span className="font-medium text-foreground">{gmailEmail}</span>
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!toAddress || sending}
                    className="gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link href="/connect-gmail" className="underline underline-offset-4">
                  Connect Gmail
                </Link>{" "}
                to send this email from your account.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Generated on{" "}
        {new Date(email.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  )
}
