const FAQ_ITEMS = [
  {
    question: 'Can I change my plan anytime?',
    answer:
      'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we will prorate the billing accordingly.',
  },
  {
    question: 'What happens if I exceed my event limit?',
    answer:
      "We will continue tracking your events and you will receive an email notification when you exceed your limit. If you exceed your limits for more than 30 days, there's a chance that your excessive tracked data will be deleted.",
  },
  {
    question: 'Do you offer annual billing?',
    answer: 'Currently we offer monthly billing only. Annual billing with discounts is coming soon!',
  },
  {
    question: 'Is there a free option?',
    answer:
      'Yes! Our Starter plan includes 10,000 free events per month forever. No credit card required to get started.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. You can cancel your subscription at any time. Your plan will remain active until the end of your current billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, MasterCard, American Express) and support secure payments through our payment processor.',
  },
];

export function BillingFAQGrid() {
  return (
    <div className='container mx-auto max-w-6xl px-4 py-8'>
      <div className='mb-12 text-center'>
        <h3 className='mb-4 text-2xl font-bold'>Frequently Asked Questions</h3>
        <p className='text-muted-foreground'>Everything you need to know about our pricing and plans</p>
      </div>

      <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {FAQ_ITEMS.map((item, index) => (
          <div key={index} className='space-y-3'>
            <h4 className='text-base font-semibold'>{item.question}</h4>
            <p className='text-muted-foreground text-sm leading-relaxed'>{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
