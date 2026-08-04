import { resolveToken } from './tokenResolver';

export interface BadgeProps {
  state: 'default' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Badge = ({ state, size, children }: BadgeProps) => {
  return (
    <span style={{ background: resolveToken('color/red/999'), borderRadius: resolveToken('radius/sm') }}>
      {children}
    </span>
  );
};
