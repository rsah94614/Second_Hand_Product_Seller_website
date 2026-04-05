import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-semibold transition-all duration-300 focus-visible:outline-none focus-[&:not(:focus-visible)]:outline-none ring-offset-white disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 hover:bg-primary-700',
        secondary: 'bg-secondary-600 text-white shadow-lg shadow-secondary-600/20 hover:shadow-xl hover:shadow-secondary-600/30 hover:-translate-y-0.5 hover:bg-secondary-700',
        outline: 'border-2 border-gray-100 bg-white text-gray-900 shadow-sm hover:border-gray-200 hover:bg-gray-50',
        ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
        link: 'text-primary-600 underline-offset-4 hover:underline text-base',
        destructive: 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:hover:shadow-xl hover:shadow-red-600/30 hover:-translate-y-0.5 hover:bg-red-700',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
