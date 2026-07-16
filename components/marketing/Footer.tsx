import Link from "next/link";

const links = [
  { href: "#", label: "Algemene voorwaarden" },
  { href: "#", label: "Privacy" },
  { href: "#", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center sm:flex-row sm:justify-between sm:text-left lg:px-8">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-emerald-400">
            S
          </span>
          <span className="font-display text-sm font-bold text-slate-900">Statieclub</span>
          <span className="hidden text-sm text-slate-400 sm:inline">— Gemaakt voor lokale helden.</span>
        </div>

        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm text-slate-500 hover:text-slate-800">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
