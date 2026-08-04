import { buttonStyles } from './buttonStyles';

export interface ButtonProps {
  state: 'default' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = ({ state, size, children }: ButtonProps) => {
  return (
    <button className={buttonStyles({ state, size })}>
      {children}
    </button>
  );
};
