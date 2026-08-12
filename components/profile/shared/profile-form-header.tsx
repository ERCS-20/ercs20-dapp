import type { ReactNode } from "react";

/** Form page header — accent follows theme `primary` (teal light / pink dark). */
export function ProfileFormHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl [&_svg]:size-6 [&_svg]:shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <h1 className="text-foreground text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
