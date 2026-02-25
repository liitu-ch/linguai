interface RecordingControlsProps {
  status: "idle" | "connecting" | "active" | "error";
  onStart: () => void;
  onStop: () => void;
}

export function RecordingControls({
  status,
  onStart,
  onStop,
}: RecordingControlsProps) {
  return (
    <div className="flex items-center gap-4">
      {status === "idle" || status === "error" ? (
        <button
          onClick={onStart}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-white font-medium hover:bg-red-700 transition-colors"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
          </span>
          Aufnahme starten
        </button>
      ) : status === "connecting" ? (
        <button
          disabled
          className="flex items-center gap-2 rounded-lg bg-yellow-500 px-6 py-3 text-white font-medium opacity-75 cursor-not-allowed"
        >
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Verbinde...
        </button>
      ) : (
        <button
          onClick={onStop}
          className="flex items-center gap-2 rounded-lg bg-gray-700 px-6 py-3 text-white font-medium hover:bg-gray-800 transition-colors"
        >
          <span className="inline-flex h-3 w-3 rounded-sm bg-white" />
          Aufnahme stoppen
        </button>
      )}

      <StatusBadge status={status} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    idle: { color: "bg-gray-400", label: "Bereit" },
    connecting: { color: "bg-yellow-400", label: "Verbinde..." },
    active: { color: "bg-green-500", label: "Live" },
    error: { color: "bg-red-500", label: "Fehler" },
  };

  const { color, label } = config[status] ?? config.idle;

  return (
    <span className="flex items-center gap-1.5 text-sm text-gray-600">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
