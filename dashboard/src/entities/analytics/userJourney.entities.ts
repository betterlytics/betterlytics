import { z } from 'zod';

/**
 * Schema definitions for Sankey diagram visualization
 */

export const SankeyNodeSchema = z.object({
  id: z.string(), // Unique identifier (url_depth)
  name: z.string(), // The URL for display
  depth: z.coerce.number(), // The depth of the node in the journey
  totalTraffic: z.coerce.number(), // Total number of users passing through this node
});

export const SankeyLinkSchema = z.object({
  source: z.coerce.number(), // Index of source node in nodes array - required format for Recharts Sankey diagram
  target: z.coerce.number(), // Index of target node in nodes array - required format for Recharts Sankey diagram
  value: z.coerce.number(), // Number of users who took this path
});

// A single transition between two consecutive steps, depth preserved
export const JourneyTransitionSchema = z.object({
  source: z.string(),
  target: z.string(),
  source_depth: z.coerce.number(),
  target_depth: z.coerce.number(),
  value: z.coerce.number(),
});

// Complete Sankey diagram data structure
export const SankeyDataSchema = z.object({
  nodes: z.array(SankeyNodeSchema),
  links: z.array(SankeyLinkSchema),
});

export type SankeyNode = z.infer<typeof SankeyNodeSchema>;
export type SankeyLink = z.infer<typeof SankeyLinkSchema>;
export type SankeyData = z.infer<typeof SankeyDataSchema>;
export type JourneyTransition = z.infer<typeof JourneyTransitionSchema>;
