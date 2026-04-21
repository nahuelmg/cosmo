import { Atom, Waves, Sparkles, Cpu, HelpCircle, type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  atom: Atom,
  waves: Waves,
  sparkles: Sparkles,
  cpu: Cpu,
};

export function getResearchIcon(iconName?: string): LucideIcon {
  return iconName ? (ICON_MAP[iconName] ?? HelpCircle) : HelpCircle;
}
