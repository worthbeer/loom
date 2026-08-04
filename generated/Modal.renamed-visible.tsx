export interface ModalProps {
  visible: boolean;
  children: React.ReactNode;
}

export const Modal = ({ visible, children }: ModalProps) => {
  if (!visible) return null;
  return (
    <div role="dialog">
      {children}
    </div>
  );
};
