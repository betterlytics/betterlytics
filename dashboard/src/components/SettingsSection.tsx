interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className='space-y-4'>
      <div>
        <h2 className='text-md font-semibold'>{title}</h2>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>

      <div className='space-y-6'>{children}</div>
    </section>
  );
}
