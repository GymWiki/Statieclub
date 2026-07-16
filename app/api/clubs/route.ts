import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postcodeCijfers } from "@/lib/utils";

/**
 * GET /api/clubs?postcode=7511AB
 * Publieke lijst van actieve clubcampagnes. Als er clubs in dezelfde
 * postcode-regio (eerste 4 cijfers) zijn, worden die als eerste getoond;
 * daarna de rest, zodat een donateur altijd resultaten ziet.
 * (clubs is een publiek leesbare tabel — hier volstaat de anon-key.)
 */
export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode") ?? "";
  const cijfers = postcodeCijfers(postcode);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("is_actief", true)
    .order("naam");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const clubs = data ?? [];
  if (!cijfers) {
    return NextResponse.json({ clubs });
  }

  const inRegio = clubs.filter((c: { postcode: string }) => c.postcode.replace(/\s/g, "").startsWith(cijfers));
  const overig = clubs.filter((c: { postcode: string }) => !c.postcode.replace(/\s/g, "").startsWith(cijfers));

  return NextResponse.json({ clubs: [...inRegio, ...overig], aantalInRegio: inRegio.length });
}
