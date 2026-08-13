import React from 'react';
import styled, { css } from 'styled-components';

export type ButtonState = 'default' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  state?: ButtonState;
  size?: ButtonSize;
  children?: React.ReactNode;
}

const stateStyles = {
  danger: css`
    background-color: ${({ theme }) => theme.colors.red600};
    color: #ffffff;
  `,
  default: css`
    background-color: transparent;
  `,
};

const sizeStyles = {
  md: css`
    padding: 8px 16px;
    font-size: 14px;
  `,
  sm: css`
    padding: 4px 8px;
    font-size: 12px;
  `,
};

const StyledButton = styled.button<{ state: ButtonState; size: ButtonSize }>`
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  ${({ state }) => stateStyles[state]}
  ${({ size }) => sizeStyles[size]}
`;

export const Button: React.FC<ButtonProps> = ({
  state = 'default',
  size = 'md',
  children,
  ...rest
}) => {
  return (
    <StyledButton state={state} size={size} {...rest}>
      {children}
    </StyledButton>
  );
};

export default Button;