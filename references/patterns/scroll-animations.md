# Scroll Animations Pattern

> Lightweight scroll-triggered animations using Intersection Observer. No animation library dependency. Respects `prefers-reduced-motion` for accessibility.

**Validated in**: Landing page project (2026-03)
**Dependencies**: None (browser APIs only)

---

## 1. FadeIn Component

A reusable wrapper that fades children in when they scroll into view:

```tsx
// src/components/fade-in.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;              // Stagger delay in ms (e.g., 150, 300)
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Respect user's motion preferences
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setPrefersReducedMotion(true);
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);   // Fire once — don't re-animate on scroll back
        }
      },
      { threshold: 0.15 }          // Trigger when 15% of element is visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${
        prefersReducedMotion
          ? ''
          : `transition-all duration-400 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`
      } ${className}`}
      style={prefersReducedMotion ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
```

---

## 2. Usage

### Basic — single element

```tsx
<FadeIn>
  <h2>Section Title</h2>
</FadeIn>
```

### Staggered — grid items with cascading delay

```tsx
<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
  {items.map((item, index) => (
    <FadeIn key={item.id} delay={index * 150}>
      <div className="rounded-lg border border-border bg-card p-8">
        <h2>{item.title}</h2>
        <p>{item.description}</p>
      </div>
    </FadeIn>
  ))}
</div>
```

### Alternating sections

```tsx
{features.map((feature, index) => (
  <FadeIn key={feature.id}>
    <div className={`flex flex-col gap-8 md:flex-row ${
      index % 2 === 1 ? 'md:flex-row-reverse' : ''
    }`}>
      <div className="flex-1">
        <Image src={feature.image} alt={feature.title} width={600} height={400} className="w-full rounded-lg" />
      </div>
      <div className="flex-1 space-y-4">
        <h3 className="text-3xl font-semibold">{feature.title}</h3>
        <p className="text-muted-foreground">{feature.description}</p>
      </div>
    </div>
  </FadeIn>
))}
```

---

## 3. How It Works

1. Element renders with `opacity-0 translate-y-4` (invisible, shifted 16px down)
2. Intersection Observer watches for 15% visibility
3. When triggered: classes swap to `opacity-100 translate-y-0` with CSS transition
4. Observer disconnects after first trigger (no re-animation on scroll back up)
5. If user has `prefers-reduced-motion: reduce`, element renders immediately with no animation

---

## 4. Customization

### Different animation directions

Replace `translate-y-4` / `translate-y-0` with:

| Direction | Hidden state | Visible state |
|-----------|-------------|---------------|
| Fade up (default) | `opacity-0 translate-y-4` | `opacity-100 translate-y-0` |
| Fade down | `opacity-0 -translate-y-4` | `opacity-100 translate-y-0` |
| Fade left | `opacity-0 translate-x-4` | `opacity-100 translate-x-0` |
| Fade right | `opacity-0 -translate-x-4` | `opacity-100 translate-x-0` |
| Fade only | `opacity-0` | `opacity-100` |
| Scale up | `opacity-0 scale-95` | `opacity-100 scale-100` |

### Adjust timing

- `duration-400` — animation length (try 300-500ms for landing pages)
- `ease-out` — deceleration curve (natural feel for reveal animations)
- `threshold: 0.15` — how much must be visible before triggering (0.1-0.3 works well)

---

## 5. Why Not a Library?

| Option | Size | Verdict |
|--------|------|---------|
| This pattern | 0 KB | Sufficient for landing pages with fade/slide animations |
| Framer Motion | ~30 KB | Overkill unless you need layout animations, gestures, or complex sequences |
| AOS (Animate On Scroll) | ~14 KB | jQuery-era approach; Intersection Observer does the same thing natively |
| GSAP | ~25 KB | For complex timelines and scroll-linked animations beyond simple reveals |

**Rule of thumb**: If all you need is "fade in when scrolled into view" (90% of landing pages), this component is all you need. Reach for Framer Motion only when you need exit animations, layout transitions, or drag gestures.

---

*Last verified: 2026-03*
