import { formatEuro } from "@/lib/utils";

/**
 * Er is in dit project bewust geen transactionele e-mailprovider
 * (Resend/Postmark/SendGrid) gekoppeld — dat is een aparte
 * infrastructuurkeuze die buiten de betalings-/facturatiearchitectuur
 * valt. Deze functie *simuleert* de verzending door de e-mail
 * gestructureerd te loggen; de call-site (`/api/cron/monthly-billing`)
 * hoeft niet te weten dat het (nog) geen echte e-mail is — vervang
 * enkel de body van deze functie door een echte provider-call om het
 * later "echt" te maken.
 */
export interface MaandrapportInput {
  clubNaam: string;
  clubEmail: string | null;
  maand: number;
  jaar: number;
  totaalOpgehaald: number;
  feeBedrag: number;
  feeStatus: "geincasseerd" | "doorgeschoven";
}

const MAAND_NAMEN = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

export async function verstuurMaandrapport(input: MaandrapportInput): Promise<void> {
  const maandNaam = MAAND_NAMEN[input.maand - 1] ?? String(input.maand);
  const feeRegel =
    input.feeStatus === "geincasseerd"
      ? `${formatEuro(input.feeBedrag)} platformfee is via automatische incasso in behandeling.`
      : `${formatEuro(input.feeBedrag)} platformfee staat nog open en schuift door naar volgende maand (nog onder de €${"2,50"}-drempel).`;

  const onderwerp = `Statieclub maandrapport ${maandNaam} ${input.jaar} — ${input.clubNaam}`;
  const inhoud = [
    `Beste ${input.clubNaam},`,
    "",
    `Deze maand is er ${formatEuro(input.totaalOpgehaald)} opgehaald via statiegeld en Glas-naar-Kas.`,
    feeRegel,
    "",
    "— Statieclub",
  ].join("\n");

  // Simulatie: gestructureerd loggen i.p.v. een echte provider
  // aanroepen. In productie: vervang dit blok door bijv.
  // `resend.emails.send({ to: input.clubEmail, subject: onderwerp, text: inhoud })`.
  console.log("[e-mail:gesimuleerd]", {
    aan: input.clubEmail ?? "(geen e-mailadres bekend)",
    onderwerp,
    inhoud,
  });
}
