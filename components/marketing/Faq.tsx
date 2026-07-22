"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useFadeUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { VRAGEN } from "@/lib/faqData";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const item = useFadeUpVariants();

  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={item}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Veelgestelde vragen</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Nog twijfels?
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={item}
          transition={{ delay: 0.1 }}
          className="mt-12 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white/60 backdrop-blur-xl"
        >
          {VRAGEN.map((v, i) => {
            const isOpen = open === i;
            return (
              <div key={v.vraag}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-semibold text-slate-900">{v.vraag}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{v.antwoord}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
