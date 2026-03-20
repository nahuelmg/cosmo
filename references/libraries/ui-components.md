# UI Component Libraries

> Source: Asset Dashboard project (2026-03-16). Verified in production.

## Comparison

| Library | Approach | Styling | Customization | Bundle |
|---------|----------|---------|--------------|--------|
| **shadcn/ui** | Copy-paste source | Tailwind | Full ownership | Only what you use |
| **Radix UI** | Headless primitives | BYO | Full (headless) | Small per component |
| **Base UI (MUI)** | Headless primitives | BYO | Full (headless) | Small per component |
| **Material UI** | Styled components | Theme system | Theme overrides | Large (~300KB) |
| **Chakra UI** | Styled system | Style props | Moderate | Medium |
| **Ant Design** | Pre-styled | Less/CSS | Theme overrides | Large |

## Recommendation

**shadcn/ui** for most projects. Reasons:
- Copy source into your repo — no version lock-in
- Native Tailwind — matches your styling approach
- Only import components you use — tiny bundle
- Full control to modify internals

## shadcn/ui Notes

**Install**: `npx shadcn@latest init` then `npx shadcn@latest add button dialog ...`

**Components used in dashboard project**:
- Button, Dialog, AlertDialog, Label, Select
- Popover, Command (searchable picker)
- DropdownMenu (asset comparison, interval selector)
- Skeleton (loading placeholders)

**Gotchas**:
- shadcn wraps **Base UI** (not Radix) in newer versions — check which primitives it uses
- Base UI `Menu.Item` uses `onClick`, not `onSelect` (Radix convention)
- Base UI `GroupLabel` requires `Menu.Group` parent — crashes without it
- `asChild` prop may not work on all Base UI components (it's a Radix pattern)
- Native HTML `<select>` is sometimes simpler than shadcn Select for basic dropdowns

**CSS Variable Integration**:
shadcn generates CSS variables in `globals.css` — customize the values, keep the naming:
```css
:root {
  --primary: oklch(0.7 0.15 175);
  --background: oklch(1 0 0);
  /* shadcn references these via @theme inline */
}
```

---

## Icons: Lucide React

**Install**: `npm install lucide-react`

Tree-shakeable — only bundles icons you import:
```typescript
import { Sun, Moon, Briefcase, Search } from 'lucide-react';
```

~400 icons available. Consistent stroke-based style.

---

*Last verified: 2026-03-18*
