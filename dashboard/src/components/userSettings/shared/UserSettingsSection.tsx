interface UserSettingsSectionProps {
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  children?: React.ReactNode;
}

export default function UserSettingsSection({
  title,
  description,
  headerAction,
  children,
}: UserSettingsSectionProps) {
  return (
    <section className='pb-10 last:pb-0'>
      <div className='border-border mb-5 flex items-center justify-between gap-4 border-b pb-3'>
        <div className='space-y-1'>
          <h2 className='text-base font-semibold'>{title}</h2>
          {description && <p className='text-muted-foreground text-sm'>{description}</p>}
        </div>
        {headerAction && <div className='flex-shrink-0'>{headerAction}</div>}
      </div>
      {children && <div className='space-y-6'>{children}</div>}
    </section>
  );
}
