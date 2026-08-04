import { buttonStyles } from './buttonStyles';

export interface ButtonProps {
  color: 'default' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = ({ color, size, children }: ButtonProps) => {
  return (
    <button className={buttonStyles({ color, size })}>
      {children}
    </button>
  );
};
