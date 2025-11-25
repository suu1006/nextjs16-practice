import { useThemeStore } from "@/app/store/use-theme";
import { Button } from "./button";
import { SunIcon } from "lucide-react";
import { MoonIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggle = useThemeStore((state) => state.toggle);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn("relative", theme === "dark" && "animate-bounce")}>
      {theme === "light" ? (
        <SunIcon className="size-4" />
      ) : (
        <MoonIcon className="size-4" />
      )}
    </Button>
  );
}
