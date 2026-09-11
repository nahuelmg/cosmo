interface ContactDetailsProps {
  address: string;
  socialLinks: Array<{ platform: string; url: string; label: string }>;
  labels: {
    addressLabel: string;
    socialLabel: string;
    noSocialMessage: string;
  };
}

export function ContactDetails({
  address,
  socialLinks,
  labels,
}: ContactDetailsProps) {
  return (
    <dl
      aria-label={labels.addressLabel}
      className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-[140px_1fr]"
    >
      <dt className="font-serif text-sm uppercase tracking-wider text-ink-subtle">
        {labels.addressLabel}
      </dt>
      <dd className="font-serif text-lg text-ink whitespace-pre-line">
        {address}
      </dd>

      <dt className="font-serif text-sm uppercase tracking-wider text-ink-subtle">
        {labels.socialLabel}
      </dt>
      <dd>
        {socialLinks.length > 0 ? (
          <ul className="flex flex-wrap gap-4">
            {socialLinks.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded"
                >
                  {s.label || s.platform}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted">{labels.noSocialMessage}</p>
        )}
      </dd>
    </dl>
  );
}
