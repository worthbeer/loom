import React from 'react';
import styled, { css } from 'styled-components';

export type ButtonState = 'default' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps {
  state?: ButtonState;
  size?: ButtonSize;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const sizeStyles = {
  sm: css`
    padding: 4px 8px;
    font-size: 12px;
  `,
  md: css`
    padding: 8px 16px;
    font-size: 14px;
  `,
};

const stateStyles = {
  default: css`
    background-color: var(--color-neutral-100);
    color: var(--color-neutral-900);
  `,
  danger: css`
    background-color: var(--color-red-600);
    color: var(--color-neutral-white);
  `,
};

const StyledButton = styled.button<{ state: ButtonState; size: ButtonSize }>`
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  ${({ size }) => sizeStyles[size]}
  ${({ state }) => stateStyles[state]}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Button: React.FC<ButtonProps> = ({
  state = 'default',
  size = 'md',
  children,
  onClick,
  disabled,
}) => {
  return (
    <StyledButton state={state} size={size} onClick={onClick} disabled={disabled}>
      {children}
    </StyledButton>
  );
};