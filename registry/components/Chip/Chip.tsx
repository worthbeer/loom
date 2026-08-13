import { chipStyles } from './chipStyles';

export interface ChipProps {
  state: 'default' | 'alert';
  size: 'sm' | 'md';
  'aria-label': string;
  children: React.ReactNode;
}

export const Chip = ({ state, size, 'aria-label': ariaLabel, children }: ChipProps) => {
  return (
    <span className={chipStyles({ state, size })} aria-label={ariaLabel}>
      {children}
    </span>
  );
};
