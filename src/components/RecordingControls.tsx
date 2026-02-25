import { MicOff, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button.tsx";
import { Badge } from "~/components/ui/badge.tsx";

interface RecordingControlsProps {
  status: "idle" | "connecting" | "active" | "error";
  onStart: () => void;
  onStop: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { variant: "secondary" | "outline" | "default" | "destructive"; label: string; dot: string }
> = {
  idle: { variant: "secondary", label: "Bereit", dot: "bg-muted-foreground" },
  connecting: { variant: "outline", label: "Verbinde...", dot: "bg-yellow-500 animate-pulse" },
  active: { variant: "default", label: "Live", dot: "bg-green-500" },
  error: { variant: "destructive", label: "Fehler", dot: "bg-destructive" },
};

export function RecordingControls({
  status,
  onStart,
  onStop,
}: RecordingControlsProps) {
  const { variant, label, dot } = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {status === "idle" || status === "error" ? (
        <Button onClick={onStart} variant="destructive" size="sm" className="sm:h-10 sm:px-6 sm:text-sm">
          <span className="relative flex size-2.5 sm:size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/60" />
            <span className="relative inline-flex size-full rounded-full bg-white" />
          </span>
          <span className="hidden sm:inline">Aufnahme starten</span>
          <span className="sm:hidden">Start</span>
        </Button>
      ) : status === "connecting" ? (
        <Button disabled size="sm" variant="outline" className="sm:h-10 sm:px-6 sm:text-sm">
          <Loader2 className="size-4 animate-spin" />
          <span className="hidden sm:inline">Verbinde...</span>
        </Button>
      ) : (
        <Button onClick={onStop} size="sm" variant="secondary" className="sm:h-10 sm:px-6 sm:text-sm">
          <MicOff className="size-4" />
          <span className="hidden sm:inline">Aufnahme stoppen</span>
          <span className="sm:hidden">Stop</span>
        </Button>
      )}

      <Badge variant={variant} className="gap-1.5">
        <span className={`size-2 rounded-full ${dot}`} />
        {label}
      </Badge>
    </div>
  );
}
