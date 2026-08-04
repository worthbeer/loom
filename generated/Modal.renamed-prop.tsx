export interface ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div role="dialog">
      {children}
    </div>
  );
};
