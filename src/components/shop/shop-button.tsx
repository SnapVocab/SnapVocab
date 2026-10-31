import type { ButtonProps } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/components/ui';

/** Shop actions share Home's raised buttons and keep a dark primary label. */
export function ShopButton({ className, textClassName, variant = 'primary', ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      variant={variant}
      className={className}
      textClassName={twMerge(variant === 'primary' && 'text-[#17330B]', textClassName)}
    />
  );
}
