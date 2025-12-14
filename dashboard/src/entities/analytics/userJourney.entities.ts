import { z } from 'zod';

/**
 * Schema definitions for Sankey diagram visualization
 */

export const SankeyNodeSchema = z.object({
  id: z.string(), // Unique identifier (url_depth)
  name: z.string(), // The URL for display
  depth: z.number(), // The depth of the node in the journey
  totalTraffic: z.number(), // Total number of users passing through this node
  percentageOfMax: z.number().min(0).max(100), // Share vs. busiest node (0-100)
});

export const SankeyLinkSchema = z.object({
  source: z.number(), // Index of source node in nodes array - required format for Recharts Sankey diagram
  target: z.number(), // Index of target node in nodes array - required format for Recharts Sankey diagram
  value: z.number(), // Number of users who took this path
});

// A single transition between two consecutive steps, depth preserved
export const JourneyTransitionSchema = z.object({
  source: z.string(),
  target: z.string(),
  source_depth: z.number(),
  target_depth: z.number(),
  value: z.number(),
});

// Complete Sankey diagram data structure
export const SankeyDataSchema = z.object({
  nodes: z.array(SankeyNodeSchema),
  links: z.array(SankeyLinkSchema),
  maxTraffic: z.number(),
});

export type SankeyNode = z.infer<typeof SankeyNodeSchema>;
export type SankeyLink = z.infer<typeof SankeyLinkSchema>;
export type SankeyData = z.infer<typeof SankeyDataSchema>;
export type JourneyTransition = z.infer<typeof JourneyTransitionSchema>;
