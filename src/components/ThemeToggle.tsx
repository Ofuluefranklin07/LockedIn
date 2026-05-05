import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const Icon = isLight ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      className={cn(
        'theme-toggle inline-flex h-11 w-11 items-center justify-center border border-[#222] bg-[#0A0A0A] text-[#888] transition-all hover:border-[#F97316]/60 hover:text-[#F97316] active:scale-95',
        className,
      )}
    >
      <Icon size={18} />
    </button>
  );
}
