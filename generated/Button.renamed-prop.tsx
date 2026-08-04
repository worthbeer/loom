import { buttonStyles } from './buttonStyles';

export interface ButtonProps {
  variant: 'default' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = ({ variant, size, children }: ButtonProps) => {
  return (
    <button className={buttonStyles({ variant, size })}>
      {children}
    </button>
  );
};
