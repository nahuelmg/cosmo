import { ResearchIcon } from './icons';

interface ResearchDetailProps {
  id: string;
  title: string;
  fullDescription: string;
  iconName?: string;
  imageOnLeft: boolean;
}

export function ResearchDetail({
  id,
  title,
  fullDescription,
  iconName,
  imageOnLeft,
}: ResearchDetailProps) {
  const paragraphs = fullDescription.split(/\n\n+/).filter(Boolean);

  return (
    <section
      id={`detail-${id}`}
      aria-labelledby={`detail-title-${id}`}
      className="scroll-mt-24 grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16"
    >
      <figure
        aria-hidden="true"
        className={`flex aspect-[4/3] items-center justify-center rounded-md bg-surface-alt ${
          imageOnLeft ? 'md:order-1' : 'md:order-2'
        }`}
      >
        <ResearchIcon iconName={iconName} className="h-32 w-32 text-accent" strokeWidth={1} />
      </figure>
      <div className={imageOnLeft ? 'md:order-2' : 'md:order-1'}>
        <h2
          id={`detail-title-${id}`}
          className="font-serif text-3xl font-semibold leading-tight"
        >
          {title}
        </h2>
        <div className="mt-5 space-y-4 leading-relaxed text-ink-muted">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
