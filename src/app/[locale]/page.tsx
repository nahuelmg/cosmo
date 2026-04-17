import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {routing} from '@/i18n/routing';

type Locale = (typeof routing.locales)[number];

type Props = {
  params: Promise<{locale: Locale}>;
};

export default async function HomePage({params}: Props) {
  // Next.js 16: params is a Promise — await before use
  const {locale} = await params;
  // setRequestLocale required in each RSC that reads translations (stays on static path)
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const tMeta = useTranslations('meta');

  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">
        {tMeta('siteName')}
      </h1>
      <p className="mt-4 text-ink-muted">
        {tMeta('institution')}
      </p>

      {/*
        Greek-subset probe — if these render in a system fallback (Times / sans-serif)
        instead of the chosen serif / sans, the Greek subset is not wired correctly.
        Verified in Task 3 checkpoint. Remove in Phase 3 when the real Home page lands.
      */}
      <p className="mt-12 font-serif text-lg">
        Greek (serif): Λ Ω H₀ σ₈ χ² μ ρ θ
      </p>
      <p className="mt-2 font-sans text-base">
        Greek (sans): Λ Ω H₀ σ₈ χ² μ ρ θ
      </p>

      <p className="mt-12 text-ink-subtle text-sm">
        Phase 1 placeholder — replaced in Phase 3 (layout shell) and Phase 4 (home page).
      </p>
    </main>
  );
}
