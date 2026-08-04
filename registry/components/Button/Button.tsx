import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { buttonStyles } from './buttonStyles';

// Extended by hand beyond LOOM's original generated output (which only had
// state/size/children) to support real HTML button attributes — onClick,
// type, disabled — needed for actual use in a real page. Worth naming: the
// pattern file this was generated from (patterns/react/Button.stories.tsx)
// never demonstrates these either, so even a live generator would have had
// no example to work from here. A real gap in the pattern source, not just
// a gap in this one output.
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  state: 'default' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export const Button = ({ state, size, children, ...rest }: ButtonProps) => {
  return (
    <button className={buttonStyles({ state, size })} {...rest}>
      {children}
    </button>
  );
};
