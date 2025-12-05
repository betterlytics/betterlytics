import { z } from "zod";

/**
 * Schema definitions for Sankey diagram visualization
 */

// A sequential path showing a complete user journey for a session
export const SequentialPathSchema = z.object({
  path: z.array(z.string()), // Array of page URLs in sequence
  count: z.number(),         // Number of users who took this exact path
});

export const SankeyNodeSchema = z.object({
  id: z.string(),          // Unique identifier (url_depth)
  name: z.string(),        // The URL for display
  depth: z.number(),       // The depth of the node in the journey
  totalTraffic: z.number() // Total number of users passing through this node
});

export const SankeyLinkSchema = z.object({
  source: z.number(), // Index of source node in nodes array - required format for Recharts Sankey diagram
  target: z.number(), // Index of target node in nodes array - required format for Recharts Sankey diagram
  value: z.number(),  // Number of users who took this path
});

// Complete Sankey diagram data structure
export const SankeyDataSchema = z.object({
  nodes: z.array(SankeyNodeSchema),
  links: z.array(SankeyLinkSchema),
});

export type SequentialPath = z.infer<typeof SequentialPathSchema>;
export type SankeyNode = z.infer<typeof SankeyNodeSchema>;
export type SankeyLink = z.infer<typeof SankeyLinkSchema>;
export type SankeyData = z.infer<typeof SankeyDataSchema>; 