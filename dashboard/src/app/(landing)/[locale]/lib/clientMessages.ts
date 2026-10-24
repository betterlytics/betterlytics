import type { Messages } from 'next-intl';

export function landingClientMessages(messages: Messages, ...extra: (keyof Messages['landing'])[]) {
  const { nav, demo, journey, network, pricing, illustrations } = messages.landing;
  const pages = Object.fromEntries(extra.map((key) => [key, messages.landing[key]]));
  return {
    pricingCards: messages.pricingCards,
    landing: { nav, demo, journey, network, pricing, illustrations, ...pages },
  };
}
