import { ReactNode, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
}: ModalProps) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (open) {
      document.addEventListener("keydown", handler);
    }

    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // unique id for this modal instance
  const modalId = useMemo(() => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`, []);

  // When this modal opens, ask other modals to close.
  useEffect(() => {
    if (open) {
      const ev = new CustomEvent("close-other-modals", { detail: { id: modalId } });
      window.dispatchEvent(ev);
    }
  }, [open, modalId]);

  // Listen for requests to close other modals; close if it's not this one.
  useEffect(() => {
    function handleCloseOther(e: Event) {
      const anyEv = e as CustomEvent;
      if (!anyEv?.detail) return;
      const incomingId = anyEv.detail.id as string | undefined;
      if (incomingId && incomingId !== modalId) {
        onClose();
      }
    }

    window.addEventListener("close-other-modals", handleCloseOther as EventListener);
    return () => window.removeEventListener("close-other-modals", handleCloseOther as EventListener);
  }, [modalId, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#1E293B] shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">

              <h2 className="text-lg font-semibold text-white">
                {title}
              </h2>

              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                <X size={16} />
              </button>

            </div>

            <div className="p-6">{children}</div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}