interface MobileBackdropProps {
  open: boolean;
  onClick: () => void;
}

export default function MobileBackdrop({ open, onClick }: MobileBackdropProps) {
  return (
    <div
      className={`lg:hidden fixed inset-0 bg-black/50 z-[1000] transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClick}
    />
  );
}