interface AdminSectionProps {
  title: string;
  children: React.ReactNode;
}

export function AdminSection({ title, children }: AdminSectionProps) {
  return (
    <div className="border-b border-border last:border-0 pb-6 last:pb-0">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}
