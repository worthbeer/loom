import { resolveToken } from './tokenResolver';

export interface ButtonProps {
  state: 'default' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = ({ state, size, children }: ButtonProps) => {
  return (
    <button style={{ background: resolveToken('color/red/999') }}>
      {children}
    </button>
  );
};
