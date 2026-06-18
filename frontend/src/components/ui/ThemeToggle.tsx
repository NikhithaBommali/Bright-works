import { MoonStar, SunMedium } from 'lucide-react';
import { Button } from './Button';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={onToggle}
      className="rounded-full"
      iconLeft={isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    />
  );
}
