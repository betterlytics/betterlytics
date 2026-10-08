import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/landing/lib/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent',
    'font-medium tracking-ui',
    'transition-[translate,background-color,border-color,box-shadow] duration-180 ease-out-expo hover:-translate-y-px',
  ],
  {
    variants: {
      variant: {
        volt: 'bg-volt text-on-volt hover:bg-volt-hover',
        paper: 'bg-on-volt text-on-paper hover:bg-white hover:shadow-[0_0_0_4px_rgb(242_245_255/0.18)]',
        onVolt: 'border-on-volt/40 text-on-volt hover:bg-on-volt/10',
        line: 'border-rule-22 text-fg hover:border-fg',
      },
      size: {
        sm: 'px-4 py-[9px] text-label',
        lg: 'px-6 py-[13px] text-body-sm max-sm:py-5 max-sm:text-body',
      },
    },
  },
);

type ButtonStyleProps = VariantProps<typeof buttonVariants>;

export function buttonStyles({ className, ...props }: ButtonStyleProps & { className?: string }) {
  return cn(buttonVariants(props), className);
}
