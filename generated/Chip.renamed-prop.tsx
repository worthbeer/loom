import { chipStyles } from './chipStyles';

export interface ChipProps {
  variant: 'default' | 'alert';
  size: 'sm' | 'md';
  'aria-label': string;
  children: React.ReactNode;
}

export const Chip = ({ variant, size, 'aria-label': ariaLabel, children }: ChipProps) => {
  return (
    <span className={chipStyles({ variant, size })} aria-label={ariaLabel}>
      {children}
    </span>
  );
};
