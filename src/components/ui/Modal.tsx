/**
 * Modal Component - Uses Global Theme Variables
 *
 * @example
 * // Basic modal with title and content
 * const [isOpen, setIsOpen] = useState(false);
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   size="md"
 * >
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 *
 * @example
 * // Modal with footer buttons
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Delete Item"
 *   size="sm"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button variant="danger" onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   <p>This action cannot be undone.</p>
 * </Modal>
 */

"use client";
// ============================================
// components/ui/Modal.jsx
// ============================================

import { cn } from "@/lib/utils";
import { useEffect } from "react";
import Button from "@/components/ui/Button";

// ============================================
// MODAL CONFIGURATION
// ============================================
const modalSizes: Record<string, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw]",
};

const Modal = ({
  isOpen,
  onClose,
  size = "md",
  title,
  children,
  footer,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  overlayClassName = "",
}: any) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={cn("modal-overlay backdrop-blur-sm p-3 sm:p-4", overlayClassName)}
      onClick={() => closeOnOverlayClick && onClose()}
    >
      <div
        className={cn(
          "relative bg-surface rounded-2xl shadow-2xl flex flex-col w-full max-h-[88dvh] sm:max-h-[85vh] overflow-hidden border border-border/80 my-auto",
          modalSizes[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Pinned to Top */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              "flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-border/80 shrink-0 bg-surface/95 backdrop-blur-sm z-10",
              headerClassName,
            )}
          >
            {title && (
              <h3 className="text-base sm:text-lg font-bold text-text pr-8 tracking-tight">{title}</h3>
            )}
            {showCloseButton && (
              <Button
                onClick={onClose}
                variant="outline"
                size="xs"
                className="absolute top-3.5 right-4 text-muted hover:text-text transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-full p-0 border-border/60 hover:bg-border/30"
                aria-label="Close modal"
              >
                <span className="text-xl leading-none">×</span>
              </Button>
            )}
          </div>
        )}

        {/* Body - Scrollable Content Area */}
        <div className={cn("px-5 py-4 sm:px-6 sm:py-5 text-text flex-1 overflow-y-auto min-h-0", bodyClassName)}>
          {children}
        </div>

        {/* Footer - Pinned to Bottom */}
        {footer && (
          <div
            className={cn(
              "px-5 py-3.5 sm:px-6 sm:py-4 border-t border-border/80 flex justify-end gap-2 shrink-0 bg-surface/95 backdrop-blur-sm z-10",
              footerClassName,
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
