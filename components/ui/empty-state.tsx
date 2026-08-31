// Style: .claude/skills/ui-design/references/components.md § Empty state
export function EmptyState({
  title,
  description,
  action,
  illustration,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  illustration: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-16 text-center">
      <div className="mb-6 w-full max-w-[240px]">{illustration}</div>
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
