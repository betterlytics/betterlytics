import type { Messages } from 'next-intl';

export function landingClientMessages(messages: Messages, extra?: Partial<Messages['landing']>) {
  const { nav, demo, journey, network, pricing, illustrations } = messages.landing;
  return {
    pricingCards: messages.pricingCards,
    landing: { nav, demo, journey, network, pricing, illustrations, ...extra },
  };
}
