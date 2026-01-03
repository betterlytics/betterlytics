interface SettingsPageHeaderProps {
  title: string;
}

export default function SettingsPageHeader({ title }: SettingsPageHeaderProps) {
  return (
    <div className='mb-8'>
      <h1 className='text-2xl font-semibold'>{title}</h1>
    </div>
  );
}
