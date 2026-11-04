import { useTranslations } from 'next-intl';
import { usePlanComparison } from '@/components/billing/usePlanComparison';
import { cn } from '@/landing/lib/cn';

/** Pinned while the table scrolls sideways on phones. */
const ROW_HEAD = 'bg-canvas max-md:sticky max-md:left-0 max-md:z-1 max-md:w-[150px] max-md:px-5';

function Included({ label }: { label: string }) {
  return (
    <svg className='mx-auto size-4 text-volt-soft' viewBox='0 0 16 16' fill='none' role='img' aria-label={label}>
      <path
        d='M3 8.4 6.2 11.6 13 4.8'
        stroke='currentColor'
        strokeWidth='1.9'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export function PlanComparison() {
  const t = useTranslations('landing.pricingPage');
  const { categories, columns, featureColumnLabel } = usePlanComparison();

  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[680px] border-collapse text-left'>
        <thead>
          <tr>
            <th scope='col' className={cn(ROW_HEAD, 'w-[34%] px-7 pt-7 pb-5 text-label font-normal text-muted')}>
              {featureColumnLabel}
            </th>
            {columns.map((column) => (
              <th
                key={column.label}
                scope='col'
                className='px-4 pt-7 pb-5 text-center text-title font-medium text-fg'
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        {categories.map((category) => (
          <tbody key={category.name}>
            <tr className='border-t border-rule'>
              <th
                scope='colgroup'
                colSpan={columns.length + 1}
                className='px-7 pt-8 pb-3 text-caption font-semibold tracking-[0.14em] text-muted uppercase max-md:px-5'
              >
                <span className='max-md:sticky max-md:left-5'>{category.name}</span>
              </th>
            </tr>
            {category.features.map((feature) => (
              <tr key={feature.name} className='border-t border-rule-08'>
                <th scope='row' className={cn(ROW_HEAD, 'px-7 py-3.5 text-body-sm font-normal text-fg/90')}>
                  {feature.name}
                </th>
                {feature.values.map((value, i) => (
                  <td key={columns[i].label} className='px-4 py-3.5 text-center text-body-sm text-fg/90'>
                    {value === true ? (
                      <Included label={t('included')} />
                    ) : value === false ? (
                      <span className='text-muted/50' role='img' aria-label={t('notIncluded')}>
                        –
                      </span>
                    ) : (
                      value
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
