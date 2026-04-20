"use client"
import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Zap, Mail, Send, RefreshCw, Copy } from "lucide-react"

type GeneratedEmail = {
  id: string
  subject: string
  body: string
  previewText: string
}

export function GenerateClient({ gmailEmail }: { gmailEmail: string | null }) {
  const [niche, setNiche] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedEmail | null>(null)
  const [toAddress, setToAddress] = useState("")
  const [sending, setSending] = useState(false)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche, targetAudience }),
    })

    if (!res.ok) {
      toast.error("Failed to generate email. Please try again.")
      setLoading(false)
      return
    }

    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  async function handleSend() {
    if (!result || !toAddress) return
    setSending(true)
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId: result.id, toAddress }),
    })
    if (res.ok) {
      toast.success(`Email sent to ${toAddress}`)
      setToAddress("")
    } else {
      const data = await res.json()
      toast.error(data.error ?? "Failed to send email")
    }
    setSending(false)
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Generate Outreach Email</h1>
        <p className="text-muted-foreground">
          Describe your service and target audience — Claude will write a personalized email.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4" />
            Email Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Your niche or service</Label>
              <Input
                id="niche"
                placeholder="e.g. SaaS onboarding consulting, SEO for e-commerce, B2B copywriting"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Target audience</Label>
              <Input
                id="audience"
                placeholder="e.g. B2B SaaS founders with 10-50 employees, Shopify store owners"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gap-2">
              <Zap className="w-4 h-4" />
              {loading ? "Generating…" : "Generate with Claude"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="w-4 h-4" />
                  Generated Email
                </CardTitle>
                <CardDescription className="mt-1">{result.previewText}</CardDescription>
              </div>
              <Badge variant="secondary">AI Generated</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Subject</p>
              <p className="font-medium">{result.subject}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Body</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.body}</p>
            </div>
            <Separator />

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResult(null)}
                className="gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </Button>
            </div>

            {gmailEmail ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-muted-foreground">
                  Send via <span className="font-medium">{gmailEmail}</span>
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
                    size="sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link href="/connect-gmail" className="underline underline-offset-4">
                  Connect Gmail
                </Link>{" "}
                to send this email directly from your account.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
