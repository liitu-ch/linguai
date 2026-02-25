import type { TTSMode } from "~/hooks/useTTS.ts";

interface TTSControlsProps {
  mode: TTSMode;
  onModeChange: (mode: TTSMode) => void;
}

export function TTSControls({ mode, onModeChange }: TTSControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Audio:</span>
      <div className="flex rounded-lg bg-gray-200 p-0.5">
        {(
          [
            { value: "off", label: "Aus" },
            { value: "browser", label: "Browser" },
            { value: "openai", label: "Premium" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => onModeChange(opt.value)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              mode === opt.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
