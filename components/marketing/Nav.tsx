"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronDown, Bike, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RolKey } from "@/lib/rollen";

const links = [{ href: "#hoe-het-werkt", label: "Hoe het werkt" }];

interface InlogOptie {
  href: string;
  label: string;
  beschrijving: string;
  icon: LucideIcon;
}

const inlogOpties: InlogOptie[] = [
  {
    href: "/speler",
    label: "Inloggen als Speler",
    beschrijving: "Scan bonnetjes, bekijk het scorebord",
    icon: Bike,
  },
  {
    href: "/admin/login",
    label: "Inloggen als Penningmeester",
    beschrijving: "Beheer je club en campagnes",
    icon: ShieldCheck,
  },
];

/**
 * `onKiesRol` licht de "Voor Besturen"-link op om, naast het scrollen
 * naar de Features-sectie, ook de globale `activeRole` in
 * `LandingPageContainer` op 'bestuur' te zetten — zo landt de bezoeker
 * meteen in de juiste, rol-specifieke content i.p.v. een neutrale sectie.
 */
export function Nav({ onKiesRol }: { onKiesRol?: (rol: RolKey) => void }) {
  const [gescrold, setGescrold] = useState(false);
  const [mobielOpen, setMobielOpen] = useState(false);
  const [inlogOpen, setInlogOpen] = useState(false);
  const inlogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      setGescrold(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!inlogOpen) return;

    function onClickBuiten(e: MouseEvent) {
      if (inlogRef.current && !inlogRef.current.contains(e.target as Node)) {
        setInlogOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setInlogOpen(false);
    }
    document.addEventListener("mousedown", onClickBuiten);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickBuiten);
      document.removeEventListener("keydown", onEscape);
    };
  }, [inlogOpen]);

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

          <div className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#features"
              onClick={() => onKiesRol?.("bestuur")}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              Voor Besturen
            </a>

            <div className="relative" ref={inlogRef}>
              <button
                onClick={() => setInlogOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={inlogOpen}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                Inloggen
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", inlogOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {inlogOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.5rem)] w-72 overflow-hidden rounded-2xl border border-slate-900/5 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl"
                  >
                    {inlogOpties.map((optie) => (
                      <Link
                        key={optie.href}
                        href={optie.href}
                        role="menuitem"
                        onClick={() => setInlogOpen(false)}
                        className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                          <optie.icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">{optie.label}</span>
                          <span className="block text-xs text-slate-500">{optie.beschrijving}</span>
                        </span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
              <a
                href="#features"
                onClick={() => {
                  onKiesRol?.("bestuur");
                  setMobielOpen(false);
                }}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Voor Besturen
              </a>

              <div className="mt-2 border-t border-slate-100 pt-2">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Inloggen
                </p>
                {inlogOpties.map((optie) => (
                  <Link
                    key={optie.href}
                    href={optie.href}
                    onClick={() => setMobielOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <optie.icon className="h-4 w-4 text-emerald-600" />
                    {optie.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
