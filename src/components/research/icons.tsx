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
      <ellipse cx="12" cy="12" rx="2" ry="1.3" transform="rotate(-20 12 12)" />
      <path d="M 13.5 11 C 16.5 10.5 18.5 13 18.5 16 C 18.5 19 16 20.5 13 20.3 C 10 20 8 19 8 17" />
      <path d="M 10.5 13 C 7.5 13.5 5.5 11 5.5 8 C 5.5 5 8 3.5 11 3.7 C 14 4 16 5 16 7" />
      <path d="M 13.4 12.3 C 14.5 12.8 15 13.6 15 14.5" />
      <path d="M 10.6 11.7 C 9.5 11.2 9 10.4 9 9.5" />
      <circle cx="20" cy="9" r="0.55" fill="currentColor" stroke="none" />
      <circle cx="4" cy="15" r="0.55" fill="currentColor" stroke="none" />
      <circle cx="17" cy="4.5" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="7" cy="19.5" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="3" cy="7" r="0.35" fill="currentColor" stroke="none" />
      <circle cx="21" cy="17" r="0.35" fill="currentColor" stroke="none" />
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
        <circle cx="3" cy="12" r="2.6" />
        <circle cx="21" cy="12" r="1.7" />
      </g>
    </svg>
  );
}

function GravityWell({ strokeWidth = 2, ...props }: IconProps) {
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
      <circle cx="12" cy="12.5" r="2.1" fill="currentColor" stroke="none" />
      <path d="M 2.5 6 Q 12 11 21.5 6" />
      <path d="M 2.5 19 Q 12 14 21.5 19" />
    </svg>
  );
}

function Posterior({ strokeWidth = 2, ...props }: IconProps) {
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
      <line x1="3" y1="19" x2="21" y2="19" />
      <path d="M 3 19 C 7 19 9 6 12 6 C 15 6 17 19 21 19" />
      <line x1="12" y1="6" x2="12" y2="19" strokeDasharray="1 1.6" />
      <line x1="8" y1="19" x2="8" y2="21.2" />
      <line x1="16" y1="19" x2="16" y2="21.2" />
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
  warp: GravityWell,
  posterior: Posterior,
};

export function ResearchIcon({iconName, ...props}: IconProps & {iconName?: string}) {
  const Icon = ICON_MAP[iconName ?? ''] ?? HelpCircle;
  return <Icon {...props} />;
}
