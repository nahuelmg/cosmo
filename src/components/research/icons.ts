import { Atom, Waves, Sparkles, Cpu, Network, Radio, HelpCircle, type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  atom: Atom,
  waves: Waves,
  sparkles: Sparkles,
  cpu: Cpu,
  network: Network,
  radio: Radio,
};

export function getResearchIcon(iconName?: string): LucideIcon {
  return iconName ? (ICON_MAP[iconName] ?? HelpCircle) : HelpCircle;
}
