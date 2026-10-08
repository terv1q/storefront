type Props = {
  title: string;
  description: string;
};

/** Temporary page body used until a stage replaces the page with real content. */
export function PagePlaceholder({ title, description }: Props) {
  return (
    <div className="mx-auto max-w-page px-page-x py-12">
      <h1 className="text-display-sm">{title}</h1>
      <p className="mt-3 max-w-2xl text-ink-600">{description}</p>
    </div>
  );
}
