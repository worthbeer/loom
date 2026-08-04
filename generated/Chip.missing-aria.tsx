import { chipStyles } from './chipStyles';

export interface ChipProps {
  state: 'default' | 'alert';
  size: 'sm' | 'md';
  children: React.ReactNode;
}

export const Chip = ({ state, size, children }: ChipProps) => {
  return (
    <span className={chipStyles({ state, size })}>
      {children}
    </span>
  );
};
