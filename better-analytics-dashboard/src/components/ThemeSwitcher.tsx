"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useState } from "react"
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(Boolean(theme && theme === 'dark'));
  
  const onToggle = (isDark: boolean) => {
    setIsDark(isDark);
    setTheme(isDark ? 'dark' : 'light');
  }

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="dark-theme-toggle" className="flex items-center gap-2 cursor-pointer">
        {isDark ? 
          <Moon size={16} className="text-muted-foreground" />
          : <Sun size={16} className="text-muted-foreground" />
        }
        <span className="text-sm font-medium text-foreground">
          {isDark ? 'Dark Theme' : 'Light Theme'} 
        </span>
      </Label>
      <Switch 
        id="dark-theme-toggle"
        checked={isDark} 
        onCheckedChange={onToggle} 
      />
    </div>
  )
} 