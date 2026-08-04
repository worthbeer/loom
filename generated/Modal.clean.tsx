export interface ModalProps {
  open: boolean;
  children: React.ReactNode;
}

export const Modal = ({ open, children }: ModalProps) => {
  if (!open) return null;
  return (
    <div role="dialog">
      {children}
    </div>
  );
};
