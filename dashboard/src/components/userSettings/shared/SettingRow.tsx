interface SettingRowProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  action: React.ReactNode;
  footer?: React.ReactNode;
}

export default function SettingRow({ label, description, action, footer }: SettingRowProps) {
  return (
    <div className='space-y-2'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:gap-4'>
        <div className='min-w-0 space-y-1 md:flex-1'>
          <div className='text-sm font-medium'>{label}</div>
          {description && <div className='text-muted-foreground text-xs'>{description}</div>}
        </div>
        <div className='mt-2 shrink-0'>{action}</div>
      </div>
      {footer}
    </div>
  );
}
