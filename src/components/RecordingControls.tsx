import { MicOff, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button.tsx";
import { cn } from "~/lib/utils.ts";

interface RecordingControlsProps {
  status: "idle" | "connecting" | "active" | "error";
  onStart: () => void;
  onStop: () => void;
  /** Full-width variant for mobile bottom bar */
  fullWidth?: boolean;
}

export function RecordingControls({
  status,
  onStart,
  onStop,
  fullWidth = false,
}: RecordingControlsProps) {
  if (fullWidth) {
    return (
      <div className="flex items-center gap-3">
        {status === "idle" || status === "error" ? (
          <Button
            onClick={onStart}
            variant="destructive"
            size="lg"
            className="flex-1 gap-2 text-base font-semibold"
          >
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/60" />
              <span className="relative inline-flex size-full rounded-full bg-white" />
            </span>
            Aufnahme starten
          </Button>
        ) : status === "connecting" ? (
          <Button
            disabled
            size="lg"
            variant="outline"
            className="flex-1 gap-2 text-base"
          >
            <Loader2 className="size-4 animate-spin" />
            Verbinde…
          </Button>
        ) : (
          <>
            <Button
              onClick={onStop}
              size="lg"
              variant="secondary"
              className="flex-1 gap-2 text-base"
            >
              <MicOff className="size-4" />
              Aufnahme stoppen
            </Button>
            <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-red-500/20 px-3.5 py-2.5">
              <span className="size-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-sm font-bold text-red-400">LIVE</span>
            </div>
          </>
        )}
      </div>
    );
  }

  // Compact inline variant (header)
  return (
    <div className="flex items-center gap-2">
      {status === "idle" || status === "error" ? (
        <Button
          onClick={onStart}
          variant="destructive"
          size="sm"
          className="gap-1.5 sm:h-9 sm:px-4"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/60" />
            <span className="relative inline-flex size-full rounded-full bg-white" />
          </span>
          <span className="hidden sm:inline">Starten</span>
        </Button>
      ) : status === "connecting" ? (
        <Button
          disabled
          size="sm"
          variant="outline"
          className="gap-1.5 sm:h-9 sm:px-4"
        >
          <Loader2 className="size-3.5 animate-spin" />
          <span className="hidden sm:inline">Verbinde…</span>
        </Button>
      ) : (
        <Button
          onClick={onStop}
          size="sm"
          variant="secondary"
          className={cn(
            "gap-1.5 sm:h-9 sm:px-4",
            "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          )}
        >
          <MicOff className="size-3.5" />
          <span className="hidden sm:inline">Stoppen</span>
        </Button>
      )}
    </div>
  );
}
