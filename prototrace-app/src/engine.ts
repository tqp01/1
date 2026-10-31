// src/engine.ts
import { GraphNode, GraphEdge, PatchOperation } from './types';

export class PrototypeEngine {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private currentVersion: number = 0;
  
  // Lưu lịch sử các phiên bản để làm tính năng Version Timeline sau này
  private history: { version: string; reason: string; timestamp: Date }[] = [];

  constructor(initialNodes: GraphNode[], initialEdges: GraphEdge[]) {
    initialNodes.forEach(n => this.nodes.set(n.id, n));
    this.edges = [...initialEdges];
    this.history.push({ version: 'v0', reason: 'Seed', timestamp: new Date() });
  }

  public getGraph() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      version: `v${this.currentVersion}`,
      versionsCount: this.history.length
    };
  }

  public getHistory() {
    return this.history;
  }
  
  // Hàm áp dụng bản vá (Patch) do Agent tạo ra
  public applyPatch(operations: PatchOperation[], reason: string): boolean {
    if (operations.length === 0) return true; // Không có gì để đổi

    this.currentVersion++;
    const newVersionId = `v${this.currentVersion}`;

    for (const op of operations) {
      if (op.op === 'update_node' && op.id && op.props) {
        const node = this.nodes.get(op.id);
        if (node) {
          // Cập nhật thuộc tính và lưu vết phiên bản thay đổi
          node.props = { ...node.props, ...op.props };
          node.last_changed = newVersionId;
          node.changed_because = reason;
        }
      }
      
      if (op.op === 'add_node' && op.node) {
        op.node.created_in = newVersionId;
        op.node.last_changed = newVersionId;
        op.node.changed_because = reason;
        this.nodes.set(op.node.id, op.node);
      }
    }

    // Lưu lại lịch sử
    this.history.push({ version: newVersionId, reason, timestamp: new Date() });
    
    console.log(`[Engine] Đã nâng cấp lên ${newVersionId}. Lý do: "${reason}"`);
    return true;
  }
}