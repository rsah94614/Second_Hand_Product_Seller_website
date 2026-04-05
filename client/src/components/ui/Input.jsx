import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 px-5 py-2 text-[15px] transition-all duration-300 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:bg-white focus:border-primary-400/50 focus:shadow-[0_0_0_4px_rgba(2,132,199,0.08)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-200',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
