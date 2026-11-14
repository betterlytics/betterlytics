import { getBillingFaq } from '@/components/billing/billingFaq';

export async function BillingFAQGrid() {
  const { title, subtitle, items } = await getBillingFaq();

  return (
    <div className='container mx-auto max-w-6xl px-4 py-8'>
      <div className='mb-12 text-center'>
        <h3 className='mb-4 text-2xl font-bold'>{title}</h3>
        <p className='text-muted-foreground'>{subtitle}</p>
      </div>

      <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {items.map((item) => (
          <div key={item.q} className='space-y-3'>
            <h4 className='text-base font-semibold'>{item.q}</h4>
            <p className='text-muted-foreground text-sm leading-relaxed'>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
