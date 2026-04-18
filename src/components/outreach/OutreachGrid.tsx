import { OutreachCard } from './OutreachCard';

type Activity = {
  id: string;
  date: string;
  type: 'talk' | 'workshop' | 'school-visit' | 'article' | 'interview' | 'video';
  title: string;
  description: string;
  image?: string;
  link?: string;
};

interface OutreachGridProps {
  activities: Activity[];
  locale: 'es' | 'en';
  learnMoreLabel: string;
}

export function OutreachGrid({ activities, locale, learnMoreLabel }: OutreachGridProps) {
  return (
    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {activities.map((a) => (
        <OutreachCard key={a.id} activity={a} locale={locale} learnMoreLabel={learnMoreLabel} />
      ))}
    </div>
  );
}
