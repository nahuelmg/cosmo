import { Atom, Waves, Sparkles, Cpu, HelpCircle } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;
type IconComponent = ComponentType<IconProps>;

function Galaxy({ strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="1.8" />
      <path d="M 12 10.2 C 16 10.2 18 13 18 17 C 18 19 16 20 14 20" />
      <path d="M 12 13.8 C 8 13.8 6 11 6 7 C 6 5 8 4 10 4" />
    </svg>
  );
}

function BinarySystem({ strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <g transform="rotate(-15 12 12)">
        <ellipse cx="12" cy="12" rx="9" ry="3.5" />
        <circle cx="3" cy="12" r="2" />
        <circle cx="21" cy="12" r="1.3" />
      </g>
    </svg>
  );
}

const ICON_MAP: Record<string, IconComponent> = {
  atom: Atom,
  waves: Waves,
  sparkles: Sparkles,
  cpu: Cpu,
  galaxy: Galaxy,
  binary: BinarySystem,
};

export function getResearchIcon(iconName?: string): IconComponent {
  return iconName ? (ICON_MAP[iconName] ?? HelpCircle) : HelpCircle;
}
