import { alertStyles } from './alertStyles';

export interface AlertProps {
  variant: 'info' | 'warning';
  size: 'sm' | 'md';
  children: React.ReactNode;
}

export const Alert = ({ variant, size, children }: AlertProps) => {
  return (
    <div className={alertStyles({ variant, size })} role="status">
      {children}
    </div>
  );
};
