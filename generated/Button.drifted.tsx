export interface ButtonProps {
  state: 'default' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = ({ state, size, children }: ButtonProps) => {
  return (
    <button
      style={state === 'danger' ? { background: '#C0392B', borderRadius: '4px' } : undefined}
    >
      {children}
    </button>
  );
};
