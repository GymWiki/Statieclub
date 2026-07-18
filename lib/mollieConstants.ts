/**
 * Losstaand van lib/mollie.ts (dat de `@mollie/api-client`-SDK
 * importeert) zodat client components deze constanten kunnen gebruiken
 * zonder de hele Mollie Node.js-SDK in de browser-bundel te trekken.
 */

/**
 * Bedrag (in euro's) vanaf wanneer de maandelijkse cron-job daadwerkelijk
 * incasseert. Blijft `clubs.openstaand_saldo_fee` eronder, dan schuift het
 * gewoon door naar de volgende maand ("rollover") — voorkomt micro-
 * incasso's van een paar cent.
 */
export const ROLLOVER_DREMPEL_EURO = 2.5;

/** Mollie-verificatiebetaling om een SEPA-machtiging (mandaat) op te zetten. */
export const MANDAAT_VERIFICATIE_BEDRAG_EURO = 0.01;
