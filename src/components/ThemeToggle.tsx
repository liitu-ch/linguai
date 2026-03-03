import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "~/contexts/ThemeContext.tsx";
import { Button } from "~/components/ui/button.tsx";
import { cn } from "~/lib/utils.ts";

const CYCLE: Record<Theme, Theme> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const ICONS: Record<Theme, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const LABELS: Record<Theme, string> = {
  system: "System",
  light: "Hell",
  dark: "Dunkel",
};

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
  variant?: "ghost" | "outline";
}

export function ThemeToggle({
  className,
  iconClassName,
  variant = "ghost",
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const Icon = ICONS[theme];

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn("size-8", className)}
      onClick={() => setTheme(CYCLE[theme])}
      title={`Theme: ${LABELS[theme]}`}
    >
      <Icon className={cn("size-4", iconClassName)} />
    </Button>
  );
}
