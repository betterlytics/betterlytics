interface SettingRowProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  action: React.ReactNode;
  footer?: React.ReactNode;
}

export default function SettingRow({ label, description, action, footer }: SettingRowProps) {
  return (
    <div className='space-y-2'>
      <div className='grid grid-cols-[1fr_auto] gap-x-4 gap-y-2'>
        <div className='self-center text-sm font-medium'>{label}</div>
        <div className='flex-shrink-0 self-center md:row-span-2'>{action}</div>
        {description && (
          <div className='text-muted-foreground col-span-2 self-center text-xs md:col-span-1'>{description}</div>
        )}
      </div>
      {footer}
    </div>
  );
}
