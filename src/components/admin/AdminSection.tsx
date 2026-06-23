interface AdminSectionProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function AdminSection({ title, children, action }: AdminSectionProps) {
  return (
    <div className="border-b border-border last:border-0 pb-6 last:pb-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}