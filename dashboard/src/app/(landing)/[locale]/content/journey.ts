/** Each step's title and note are under `landing.journey.steps.<id>` in the messages. */
export const JOURNEY_STEPS = ['find', 'see', 'do', 'follow', 'wait', 'errors', 'reach'] as const;

export type JourneyStep = (typeof JOURNEY_STEPS)[number];
