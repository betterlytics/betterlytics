interface SettingRowProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  action: React.ReactNode;
  /** Optional content rendered directly below the row (still inside the row's spacing). */
  footer?: React.ReactNode;
}

/**
 * Single label / description / action row used across the user settings dialog.
 *
 * Layout uses a 2-column grid that switches behaviour at the `md` breakpoint:
 *   - Mobile: `[label │ action]` on the top row; description spans both columns on a new row underneath.
 *   - Desktop: `[label │ action(row-span 2, centered)]`; description sits in the left column under the label.
 *
 * Label/description content is passed as `ReactNode` so callers can use `<Label htmlFor>` when paired
 * with form controls (switches, inputs) without the row enforcing a tag.
 */
export default function SettingRow({ label, description, action, footer }: SettingRowProps) {
  return (
    <div className='space-y-2'>
      <div className='grid grid-cols-[1fr_auto] gap-x-4 gap-y-2'>
        <div className='self-center text-sm font-medium'>{label}</div>
        <div className='flex-shrink-0 self-center md:row-span-2'>{action}</div>
        {description && (
          <p className='text-muted-foreground col-span-2 self-center text-xs md:col-span-1'>
            {description}
          </p>
        )}
      </div>
      {footer}
    </div>
  );
}
