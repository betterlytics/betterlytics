import { SankeyData } from '@/entities/analytics/userJourney.entities';
import { HighlightState } from './types';

/**
 * Represents a connection between nodes with its value (weight)
 */
export interface NodeConnection {
  nodeId: string;
  nodeIndex: number;
  value: number;
}

/**
 * Processed node with computed adjacency information
 */
export interface GraphNode {
  id: string;
  name: string;
  depth: number;
  index: number;
  totalTraffic: number;
  outgoing: NodeConnection[];
  incoming: NodeConnection[];
  // Pre-computed aggregates
  outgoingTotal: number;
  incomingTotal: number;
  outgoingCount: number;
  incomingCount: number;
}

/**
 * Processed link with resolved node references
 */
export interface GraphLink {
  index: number;
  sourceId: string;
  targetId: string;
  sourceIndex: number;
  targetIndex: number;
  value: number;
}

/**
 * SankeyGraph - A data structure that encapsulates the graph topology
 * and provides efficient traversal methods.
 *
 * This separates the graph logic from visual/layout concerns.
 */
export class SankeyGraph {
  private readonly _nodes: Map<string, GraphNode>;
  private readonly _nodesByIndex: Map<number, GraphNode>;
  private readonly _links: GraphLink[];
  private readonly _depthGroups: Map<number, GraphNode[]>;
  private readonly _maxDepth: number;
  private readonly _maxColumnCount: number;
  private readonly _maxTraffic: number;
  private readonly _maxColumnTraffic: number;
  private readonly _linksBySourceTarget: Map<string, number>;

  constructor(data: SankeyData) {
    this._nodes = new Map();
    this._nodesByIndex = new Map();
    this._links = [];
    this._depthGroups = new Map();
    this._linksBySourceTarget = new Map();

    // Build node map with empty adjacency lists
    data.nodes.forEach((node, index) => {
      const graphNode: GraphNode = {
        id: node.id,
        name: node.name,
        depth: node.depth,
        index,
        totalTraffic: node.totalTraffic,
        outgoing: [],
        incoming: [],
        outgoingTotal: 0,
        incomingTotal: 0,
        outgoingCount: 0,
        incomingCount: 0,
      };
      this._nodes.set(node.id, graphNode);
      this._nodesByIndex.set(index, graphNode);

      // Group by depth
      if (!this._depthGroups.has(node.depth)) {
        this._depthGroups.set(node.depth, []);
      }
      this._depthGroups.get(node.depth)!.push(graphNode);
    });

    // Build links and populate adjacency lists
    data.links.forEach((link, index) => {
      const sourceNode = this._nodesByIndex.get(link.source);
      const targetNode = this._nodesByIndex.get(link.target);

      if (sourceNode && targetNode) {
        // Add to adjacency lists
        sourceNode.outgoing.push({
          nodeId: targetNode.id,
          nodeIndex: targetNode.index,
          value: link.value,
        });
        targetNode.incoming.push({
          nodeId: sourceNode.id,
          nodeIndex: sourceNode.index,
          value: link.value,
        });

        // Update aggregates
        sourceNode.outgoingTotal += link.value;
        sourceNode.outgoingCount += 1;
        targetNode.incomingTotal += link.value;
        targetNode.incomingCount += 1;

        // Store processed link
        const graphLink: GraphLink = {
          index,
          sourceId: sourceNode.id,
          targetId: targetNode.id,
          sourceIndex: sourceNode.index,
          targetIndex: targetNode.index,
          value: link.value,
        };
        this._links.push(graphLink);

        // Index for fast lookup
        this._linksBySourceTarget.set(`${sourceNode.id}:${targetNode.id}`, index);
      }
    });

    // Compute derived values
    this._maxDepth = Math.max(0, ...Array.from(this._depthGroups.keys()));
    this._maxColumnCount = Math.max(0, ...Array.from(this._depthGroups.values()).map((g) => g.length));
    this._maxTraffic = Math.max(1, ...Array.from(this._nodes.values()).map((n) => n.totalTraffic));

    // Compute max column traffic
    let maxColTraffic = 0;
    this._depthGroups.forEach((nodes) => {
      const total = nodes.reduce((sum, n) => sum + n.totalTraffic, 0);
      maxColTraffic = Math.max(maxColTraffic, total);
    });
    this._maxColumnTraffic = maxColTraffic;
  }

  // ============================================
  // ACCESSORS
  // ============================================

  get nodes(): Map<string, GraphNode> {
    return this._nodes;
  }

  get nodesByIndex(): Map<number, GraphNode> {
    return this._nodesByIndex;
  }

  get links(): GraphLink[] {
    return this._links;
  }

  get depthGroups(): Map<number, GraphNode[]> {
    return this._depthGroups;
  }

  get maxDepth(): number {
    return this._maxDepth;
  }

  get maxColumnCount(): number {
    return this._maxColumnCount;
  }

  get maxTraffic(): number {
    return this._maxTraffic;
  }

  get maxColumnTraffic(): number {
    return this._maxColumnTraffic;
  }

  get nodeCount(): number {
    return this._nodes.size;
  }

  get linkCount(): number {
    return this._links.length;
  }

  get isEmpty(): boolean {
    return this._nodes.size === 0;
  }

  // ============================================
  // NODE LOOKUPS
  // ============================================

  getNode(id: string): GraphNode | undefined {
    return this._nodes.get(id);
  }

  getNodeByIndex(index: number): GraphNode | undefined {
    return this._nodesByIndex.get(index);
  }

  getNodesAtDepth(depth: number): GraphNode[] {
    return this._depthGroups.get(depth) || [];
  }

  getLinkIndex(sourceId: string, targetId: string): number {
    return this._linksBySourceTarget.get(`${sourceId}:${targetId}`) ?? -1;
  }

  // ============================================
  // TRAVERSAL METHODS
  // ============================================

  /**
   * Find all connected nodes and links from a starting node.
   * Traverses both upstream (incoming) and downstream (outgoing) directions.
   */
  findConnectedFromNode(startNodeId: string): HighlightState {
    const nodeIds = new Set<string>();
    const linkIndices = new Set<number>();

    const startNode = this._nodes.get(startNodeId);
    if (!startNode) {
      return { nodeIds, linkIndices };
    }

    const traverseUpstream = (nodeId: string) => {
      if (nodeIds.has(nodeId)) return;
      nodeIds.add(nodeId);

      const node = this._nodes.get(nodeId);
      if (!node) return;

      node.incoming.forEach((conn) => {
        const linkIndex = this.getLinkIndex(conn.nodeId, nodeId);
        if (linkIndex !== -1) {
          linkIndices.add(linkIndex);
        }
        traverseUpstream(conn.nodeId);
      });
    };

    const traverseDownstream = (nodeId: string) => {
      if (nodeIds.has(nodeId)) return;
      nodeIds.add(nodeId);

      const node = this._nodes.get(nodeId);
      if (!node) return;

      node.outgoing.forEach((conn) => {
        const linkIndex = this.getLinkIndex(nodeId, conn.nodeId);
        if (linkIndex !== -1) {
          linkIndices.add(linkIndex);
        }
        traverseDownstream(conn.nodeId);
      });
    };

    nodeIds.add(startNodeId);

    startNode.incoming.forEach((conn) => {
      const linkIndex = this.getLinkIndex(conn.nodeId, startNodeId);
      if (linkIndex !== -1) {
        linkIndices.add(linkIndex);
      }
      traverseUpstream(conn.nodeId);
    });

    startNode.outgoing.forEach((conn) => {
      const linkIndex = this.getLinkIndex(startNodeId, conn.nodeId);
      if (linkIndex !== -1) {
        linkIndices.add(linkIndex);
      }
      traverseDownstream(conn.nodeId);
    });

    return { nodeIds, linkIndices };
  }

  /**
   * Find all connected nodes and links from a starting link.
   * Traverses upstream from the source and downstream from the target.
   */
  findConnectedFromLink(linkIndex: number): HighlightState {
    const nodeIds = new Set<string>();
    const linkIndices = new Set<number>();

    const link = this._links[linkIndex];
    if (!link) {
      return { nodeIds, linkIndices };
    }

    linkIndices.add(linkIndex);
    nodeIds.add(link.sourceId);
    nodeIds.add(link.targetId);

    const traverseUpstream = (nodeId: string) => {
      const node = this._nodes.get(nodeId);
      if (!node) return;

      node.incoming.forEach((conn) => {
        const connLinkIndex = this.getLinkIndex(conn.nodeId, nodeId);
        if (connLinkIndex !== -1 && !linkIndices.has(connLinkIndex)) {
          linkIndices.add(connLinkIndex);
          nodeIds.add(conn.nodeId);
          traverseUpstream(conn.nodeId);
        }
      });
    };

    const traverseDownstream = (nodeId: string) => {
      const node = this._nodes.get(nodeId);
      if (!node) return;

      node.outgoing.forEach((conn) => {
        const connLinkIndex = this.getLinkIndex(nodeId, conn.nodeId);
        if (connLinkIndex !== -1 && !linkIndices.has(connLinkIndex)) {
          linkIndices.add(connLinkIndex);
          nodeIds.add(conn.nodeId);
          traverseDownstream(conn.nodeId);
        }
      });
    };

    traverseUpstream(link.sourceId);
    traverseDownstream(link.targetId);

    return { nodeIds, linkIndices };
  }
}

/**
 * Factory function to create a SankeyGraph from SankeyData
 */
export function createSankeyGraph(data: SankeyData): SankeyGraph {
  return new SankeyGraph(data);
}
