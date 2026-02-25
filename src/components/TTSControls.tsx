import { Volume2, VolumeOff, Sparkles } from "lucide-react";
import type { TTSMode } from "~/hooks/useTTS.ts";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group.tsx";

interface TTSControlsProps {
  mode: TTSMode;
  onModeChange: (mode: TTSMode) => void;
}

const OPTIONS: { value: TTSMode; label: string; icon: typeof Volume2 }[] = [
  { value: "off", label: "Aus", icon: VolumeOff },
  { value: "browser", label: "Browser", icon: Volume2 },
  { value: "openai", label: "Premium", icon: Sparkles },
];

export function TTSControls({ mode, onModeChange }: TTSControlsProps) {
  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(v) => {
        if (v) onModeChange(v as TTSMode);
      }}
      variant="outline"
      size="sm"
    >
      {OPTIONS.map((opt) => (
        <ToggleGroupItem key={opt.value} value={opt.value} className="gap-1 text-xs px-2 sm:px-2.5">
          <opt.icon className="size-3.5 sm:size-3" />
          <span className="hidden sm:inline">{opt.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
