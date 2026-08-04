import { alertStyles } from './alertStyles';

export interface AlertProps {
  state: 'info' | 'warning';
  size: 'sm' | 'md';
  children: React.ReactNode;
}

export const Alert = ({ state, size, children }: AlertProps) => {
  return (
    <div className={alertStyles({ state, size })} role="status">
      {children}
    </div>
  );
};
