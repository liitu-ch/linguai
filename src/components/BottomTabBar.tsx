import { Radio, Settings } from "lucide-react";
import { cn } from "~/lib/utils.ts";

export type SessionTab = "live" | "settings";

interface BottomTabBarProps {
  activeTab: SessionTab;
  onTabChange: (tab: SessionTab) => void;
  hasUnread?: boolean;
}

const TABS: { id: SessionTab; label: string; icon: typeof Radio }[] = [
  { id: "live", label: "Live", icon: Radio },
  { id: "settings", label: "Einstellungen", icon: Settings },
];

export function BottomTabBar({
  activeTab,
  onTabChange,
  hasUnread,
}: BottomTabBarProps) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50",
        "border-t bg-background/80 backdrop-blur-lg",
        "pb-[env(safe-area-inset-bottom,0px)]"
      )}
    >
      <div className="flex h-14">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="size-5" />
                {tab.id === "live" && hasUnread && !isActive && (
                  <span className="absolute -right-1 -top-1 size-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
