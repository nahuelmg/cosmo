import Image from 'next/image';

interface OutreachCardProps {
  activity: {
    id: string;
    date: string;          // "YYYY-MM-DD"
    type: 'talk' | 'workshop' | 'school-visit' | 'article' | 'interview' | 'video';
    title: string;         // localized
    description: string;   // localized
    image?: string;        // relative path from content (e.g. "outreach/foo.jpg")
    link?: string;         // full URL
  };
  locale: 'es' | 'en';
  learnMoreLabel: string;  // from t('outreach.learnMore')
}

export function OutreachCard({ activity, locale, learnMoreLabel }: OutreachCardProps) {
  const formatted = new Intl.DateTimeFormat(
    locale === 'es' ? 'es-AR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  ).format(new Date(activity.date));

  return (
    <article className="flex flex-col rounded-md bg-surface-alt overflow-hidden">
      {activity.image && (
        <div className="relative w-full aspect-[16/9] bg-surface">
          <Image
            src={`/${activity.image}`}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs uppercase tracking-wider text-ink-subtle">{activity.type}</p>
        <h2 className="mt-1 font-serif text-xl font-semibold">{activity.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          <time dateTime={activity.date}>{formatted}</time>
        </p>
        <p className="mt-3 text-ink-muted leading-relaxed">{activity.description}</p>
        {activity.link && (
          <a
            href={activity.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 self-start text-sm text-accent underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded"
          >
            {learnMoreLabel} →
          </a>
        )}
      </div>
    </article>
  );
}
