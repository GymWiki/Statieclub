import Link from "next/link";
import { Mail } from "lucide-react";

const PRODUCT_LINKS = [
  { href: "#hoe-het-werkt", label: "Hoe werkt het?" },
  { href: "/donateren", label: "Glas-naar-Kas Service" },
  { href: "#prijzen", label: "Prijzen & Tarieven (5% fee)" },
];

const JURIDISCH_LINKS = [
  { href: "#", label: "Algemene Voorwaarden" },
  { href: "#", label: "Privacybeleid" },
  { href: "#", label: "Cookiebeleid" },
];

const BEDRIJFSGEGEVENS = [
  { label: "Handelsnaam", waarde: "StatieClub" },
  { label: "Bedrijfsnaam", waarde: "GymWiki" },
  { label: "KVK-nummer", waarde: "97351911" },
  { label: "BTW-nummer", waarde: "NL005266843B58" },
];

const CONTACT_EMAIL = "statieclub@gmail.com";

/**
 * Footer voor de marketing-landingspagina — donker (bg-slate-900,
 * zelfde toon als ClubPitch/WhyBetter) en met de bedrijfsgegevens die
 * een clubbestuur nodig heeft om Statieclub te vertrouwen als
 * volwaardige zakelijke partij, niet enkel een los projectje.
 *
 * De juridische links (Algemene Voorwaarden/Privacybeleid/
 * Cookiebeleid) zijn bewust nog `#`-placeholders: er bestaat nog geen
 * echte, juridisch gecontroleerde inhoud voor die pagina's. Een
 * footer met deze links alléén maakt het platform dus nog niet
 * AVG/GDPR-compliant — dat vraagt om daadwerkelijk beleid, met
 * bijbehorende review, achter deze links.
 */
export function Footer() {
  return (
    <footer className="bg-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Kolom 1 — Over Statieclub */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/15 text-sm font-bold text-emerald-400">
                S
              </span>
              <span className="font-display text-sm font-bold text-white">Statieclub</span>
            </Link>
            <p className="mt-4 text-sm text-slate-400">
              Het slimste en groenste alternatief voor de clubkas.
            </p>
            <p className="mt-6 text-xs text-slate-500">© 2026 Statieclub. Gemaakt in Zwolle.</p>
          </div>

          {/* Kolom 2 — Product & Links */}
          <div>
            <h3 className="text-sm font-semibold text-white">Product & Links</h3>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3 — Juridisch & Veiligheid */}
          <div>
            <h3 className="text-sm font-semibold text-white">Juridisch & Veiligheid</h3>
            <ul className="mt-4 space-y-2.5">
              {JURIDISCH_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-slate-400 transition-colors hover:text-white hover:underline hover:underline-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 4 — Bedrijfsgegevens & Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white">Bedrijfsgegevens & Contact</h3>
            <dl className="mt-4 space-y-1.5 text-xs text-slate-400">
              {BEDRIJFSGEGEVENS.map((item) => (
                <div key={item.label} className="flex gap-1.5">
                  <dt className="text-slate-500">{item.label}:</dt>
                  <dd className="text-slate-300">{item.waarde}</dd>
                </div>
              ))}
            </dl>
            <Link
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-white hover:underline hover:underline-offset-2"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" /> {CONTACT_EMAIL}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
