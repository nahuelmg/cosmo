import Image from 'next/image';
import { Link } from '@/i18n/navigation';

interface PersonCardProps {
  slug: string;
  name: string;
  role: string;
  photo?: string;
}

export function PersonCard({ slug, name, role, photo }: PersonCardProps) {
  return (
    <Link
      href={{ pathname: '/people/[slug]', params: { slug } }}
      className="group block rounded-md bg-surface-alt overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface max-w-[240px] w-full mx-auto"
    >
      <div className="relative w-full aspect-[4/5] bg-surface">
        {photo ? (
          <Image
            src={`/${photo}`}
            alt=""
            fill
            sizes="(min-width: 640px) 240px, 100vw"
            className="object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.02]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-ink-subtle font-serif text-4xl"
          >
            {name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-xl font-semibold group-hover:underline underline-offset-4 decoration-accent">
          {name}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">{role}</p>
      </div>
    </Link>
  );
}
