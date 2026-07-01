import type { LinkProps } from 'expo-router';
import { Link } from 'expo-router';

type Props = LinkProps & {
  className?: string;
};

export function ThemedLink({ className = '', ...props }: Props) {
  return (
    <Link
      className={`font-semibold text-primary-500 dark:text-primary-300 ${className}`}
      {...props}
    />
  );
}
