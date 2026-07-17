"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * Herbruikbare mobile-first bottom sheet (slide-up modal). Gebruikt
 * voor de claim-flow van het Ophaal Prikbord: precies dít scherm is
 * de enige plek waar een geanonimiseerd prikbord-item verandert in
 * een concreet adres — vandaar de expliciete "Claim"-stap i.p.v.
 * meteen alles te tonen.
 */
export function BottomSheet({
  open,
  onClose,
  titel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  titel?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-200" />
            <div className="flex items-center justify-between gap-4">
              {titel && <h2 className="text-lg font-bold text-gray-900">{titel}</h2>}
              <button
                onClick={onClose}
                aria-label="Sluiten"
                className="ml-auto rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
