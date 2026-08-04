import { chipStyles } from './chipStyles';

export interface ChipProps {
  color: 'default' | 'alert';
  size: 'sm' | 'md';
  'aria-label': string;
  children: React.ReactNode;
}

export const Chip = ({ color, size, 'aria-label': ariaLabel, children }: ChipProps) => {
  return (
    <span className={chipStyles({ color, size })} aria-label={ariaLabel}>
      {children}
    </span>
  );
};
