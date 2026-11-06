import Stripe from 'stripe';
import { PLANS } from '../src/lib/billing/catalog/plans';
import type { PlanDefinition } from '../src/lib/billing/catalog/types';

/*
 * Syncs Stripe with the plan catalog, one product per plan and event volume.
 *   --phase=prices  before the deploy: adds the catalog's prices
 *   --phase=launch  after the deploy, since archived prices can't be bought: renames the retired
 *                   products, makes the new prices their default and archives the retired prices
 * Dry run unless --apply; a live key also needs --live.
 *   pnpm --filter dashboard exec tsx --env-file=../.env scripts/sync-stripe-prices.ts --phase=prices
 */

type Phase = 'prices' | 'launch';

type Offer = {
  plan: PlanDefinition;
  events: number;
  lookupKey: string;
  usd: number;
  eur: number;
  retiredLookupKey?: string;
};

function parseArgs(argv: string[]): { phase: Phase; apply: boolean; live: boolean } {
  const phase = argv.find((arg) => arg.startsWith('--phase='))?.slice('--phase='.length);
  if (phase !== 'prices' && phase !== 'launch') {
    throw new Error('Pass --phase=prices or --phase=launch');
  }
  return { phase, apply: argv.includes('--apply'), live: argv.includes('--live') };
}

function catalogOffers(): Offer[] {
  return Object.values(PLANS).flatMap((plan) =>
    plan.bands.flatMap((band) => {
      const lookupKey = band.lookupKeys.month;
      const amounts = band.prices.month;
      if (!lookupKey || !amounts || amounts.USD === 0) return [];
      const retired = plan.legacyPrices.find(
        (price) => price.interval === 'month' && price.events === band.events,
      );
      return [
        {
          plan,
          events: band.events,
          lookupKey,
          usd: amounts.USD,
          eur: amounts.EUR,
          retiredLookupKey: retired?.lookupKey,
        },
      ];
    }),
  );
}

function compactEvents(events: number): string {
  return events >= 1_000_000 ? `${events / 1_000_000}M` : `${events / 1_000}K`;
}

function productName(offer: Offer): string {
  return `${offer.plan.name} – ${compactEvents(offer.events)} events`;
}

function money(cents: number | null | undefined, currency: string): string {
  return cents == null ? 'missing' : `${currency.toLowerCase() === 'eur' ? '€' : '$'}${cents / 100}`;
}

function productOf(price: Stripe.Price): Stripe.Product {
  return price.product as Stripe.Product;
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  return typeof value === 'string' ? value : (value?.id ?? null);
}

function isMissing(error: unknown): boolean {
  return error instanceof Stripe.errors.StripeInvalidRequestError && error.code === 'resource_missing';
}

async function priceByLookupKey(stripe: Stripe, lookupKey: string): Promise<Stripe.Price | null> {
  const { data } = await stripe.prices.list({
    lookup_keys: [lookupKey],
    expand: ['data.product', 'data.currency_options'],
    limit: 1,
  });
  return data[0] ?? null;
}

function newProductId(offer: Offer): string {
  return `${offer.plan.id}_${offer.events}_events`;
}

/** Reuses the retired price's product, so existing customers' invoices carry on under it. */
async function productFor(stripe: Stripe, offer: Offer): Promise<Stripe.Product | null> {
  if (offer.retiredLookupKey) {
    const retired = await priceByLookupKey(stripe, offer.retiredLookupKey);
    if (retired) return productOf(retired);
  }
  return stripe.products.retrieve(newProductId(offer)).catch((error: unknown) => {
    if (isMissing(error)) return null;
    throw error;
  });
}

async function retiredTaxCode(stripe: Stripe, offers: Offer[]): Promise<string | null> {
  for (const offer of offers) {
    const retired = offer.retiredLookupKey ? await priceByLookupKey(stripe, offer.retiredLookupKey) : null;
    const taxCode = retired ? idOf(productOf(retired).tax_code) : null;
    if (taxCode) return taxCode;
  }
  return null;
}

function priceIssues(price: Stripe.Price, offer: Offer): string[] {
  const issues: string[] = [];
  if (!price.active) issues.push('archived');
  if (price.currency !== 'usd' || price.unit_amount !== offer.usd) {
    issues.push(`charges ${money(price.unit_amount, price.currency)}, catalog ${money(offer.usd, 'usd')}`);
  }
  const eur = price.currency_options?.eur?.unit_amount;
  if (eur !== offer.eur) issues.push(`EUR is ${money(eur, 'eur')}, catalog ${money(offer.eur, 'eur')}`);
  if (price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1) issues.push('not monthly');
  return issues;
}

async function addPrices(stripe: Stripe, offers: Offer[], apply: boolean): Promise<number> {
  let problems = 0;
  for (const offer of offers) {
    const existing = await priceByLookupKey(stripe, offer.lookupKey);
    if (existing) {
      const issues = priceIssues(existing, offer);
      if (issues.length) problems++;
      console.log(
        `${issues.length ? 'MISMATCH' : 'ok      '} ${offer.lookupKey}${issues.length ? `: ${issues.join('; ')}` : ''}`,
      );
      continue;
    }

    let product = await productFor(stripe, offer);
    console.log(
      `create   ${offer.lookupKey} ${money(offer.usd, 'usd')} / ${money(offer.eur, 'eur')} a month on ` +
        (product ? `"${product.name}"` : `new product "${productName(offer)}"`),
    );
    if (!apply) continue;

    product ??= await stripe.products.create({
      id: newProductId(offer),
      name: productName(offer),
      tax_code: (await retiredTaxCode(stripe, offers)) ?? undefined,
      metadata: { plan: offer.plan.id, events: String(offer.events) },
    });
    await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: offer.usd,
      currency_options: { eur: { unit_amount: offer.eur } },
      recurring: { interval: 'month' },
      lookup_key: offer.lookupKey,
      metadata: { plan: offer.plan.id, events: String(offer.events) },
    });
  }
  return problems;
}

async function renameProduct(
  stripe: Stripe,
  product: Stripe.Product,
  offer: Offer,
  defaultPrice: string,
  apply: boolean,
): Promise<void> {
  const name = productName(offer);
  if (product.name === name && (idOf(product.default_price) ?? '') === defaultPrice) return;
  console.log(`update   "${product.name}" → "${name}", default price ${defaultPrice ? offer.lookupKey : 'none'}`);
  if (!apply) return;
  await stripe.products.update(product.id, {
    name,
    default_price: defaultPrice,
    metadata: { plan: offer.plan.id, events: String(offer.events) },
  });
}

async function launch(stripe: Stripe, offers: Offer[], apply: boolean): Promise<number> {
  let problems = 0;
  for (const offer of offers) {
    const price = await priceByLookupKey(stripe, offer.lookupKey);
    if (!price?.active) {
      problems++;
      console.log(`MISSING  ${offer.lookupKey}: run --phase=prices first`);
      continue;
    }
    const product = productOf(price);
    await renameProduct(stripe, product, offer, price.id, apply);

    const retired = offer.retiredLookupKey ? await priceByLookupKey(stripe, offer.retiredLookupKey) : null;
    if (!retired?.active) continue;
    // Stripe won't archive a product's default price, so a retired price on its own product loses that first
    if (productOf(retired).id !== product.id) await renameProduct(stripe, productOf(retired), offer, '', apply);
    console.log(`archive  ${retired.lookup_key}`);
    if (apply) await stripe.prices.update(retired.id, { active: false });
  }
  return problems;
}

async function reportPortal(stripe: Stripe): Promise<void> {
  const { data } = await stripe.billingPortal.configurations.list({ active: true, limit: 10 });
  for (const config of data) {
    const label = config.is_default ? 'default portal' : `portal ${config.id}`;
    const update = config.features.subscription_update;
    if (!update.enabled) {
      console.log(`${label}: plan switching off`);
      continue;
    }
    const priceIds = (update.products ?? []).flatMap((product) => product.prices);
    const prices = await Promise.all(priceIds.map((id) => stripe.prices.retrieve(id)));
    const archived = prices.filter((price) => !price.active).map((price) => price.lookup_key ?? price.id);
    console.log(
      `${label}: plan switching on for ${prices.length} prices` +
        (archived.length ? `, archived: ${archived.join(', ')}` : ''),
    );
  }
}

async function main() {
  const { phase, apply, live } = parseArgs(process.argv.slice(2));
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  const isLive = /^(sk|rk)_live_/.test(key);
  if (isLive && !live) throw new Error('STRIPE_SECRET_KEY is a live key; pass --live to use it');

  const stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
  console.log(
    `${isLive ? 'LIVE' : 'test'} mode, phase ${phase}${apply ? '' : ' (dry run; pass --apply to write)'}`,
  );

  const offers = catalogOffers();
  const problems =
    phase === 'prices' ? await addPrices(stripe, offers, apply) : await launch(stripe, offers, apply);
  await reportPortal(stripe).catch((error: unknown) =>
    console.log(`portal not checked: ${error instanceof Error ? error.message : error}`),
  );
  if (problems) {
    console.log(`${problems} problem(s)`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
