"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [{ href: "#hoe-het-werkt", label: "Hoe het werkt" }];

export function Nav() {
  const [gescrold, setGescrold] = useState(false);
  const [mobielOpen, setMobielOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setGescrold(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-shadow duration-300",
        gescrold ? "shadow-[0_1px_0_0_rgba(15,23,42,0.06)]" : ""
      )}
    >
      <div className="border-b border-slate-900/5 bg-white/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-emerald-400">
              S
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              Statieclub
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/admin/login"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              Voor clubs (inloggen)
            </Link>
          </div>

          <button
            className="grid h-10 w-10 place-items-center rounded-full text-slate-700 md:hidden"
            onClick={() => setMobielOpen((v) => !v)}
            aria-label={mobielOpen ? "Sluit menu" : "Open menu"}
            aria-expanded={mobielOpen}
          >
            {mobielOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {mobielOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-b border-slate-900/5 bg-white/90 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobielOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/admin/login"
                className="mt-1 rounded-lg border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold text-slate-700"
              >
                Voor clubs (inloggen)
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
