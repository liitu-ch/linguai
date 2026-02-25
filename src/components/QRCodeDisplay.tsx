import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card.tsx";
import { Button } from "~/components/ui/button.tsx";

interface QRCodeDisplayProps {
  url: string;
  sessionId: string;
}

export function QRCodeDisplay({ url, sessionId }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground font-medium">
          QR-Code für Zuhörer
        </CardTitle>
        <CardDescription>Session: {sessionId}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="rounded-xl border bg-white p-3 sm:p-4">
          <QRCodeSVG value={url} size={160} level="M" className="size-32 sm:size-[180px]" />
        </div>
        <div className="flex w-full items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2.5 py-2 text-[11px] sm:text-xs text-muted-foreground">
            {url}
          </code>
          <Button variant="outline" size="icon" className="shrink-0" onClick={copyUrl}>
            {copied ? (
              <Check className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
