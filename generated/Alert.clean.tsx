import { alertStyles } from './alertStyles';

export interface AlertProps {
  status: 'info' | 'warning';
  size: 'sm' | 'md';
  children: React.ReactNode;
}

export const Alert = ({ status, size, children }: AlertProps) => {
  return (
    <div className={alertStyles({ status, size })} role="status">
      {children}
    </div>
  );
};
