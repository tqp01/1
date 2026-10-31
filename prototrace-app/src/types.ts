// src/types.ts

export type NodeType = 'Screen' | 'Component' | 'State' | 'Requirement' | 'Rule';
export type EdgeKind = 'implements' | 'governed_by' | 'visible_when';

export interface GraphNode {
  id: string;
  type: NodeType;
  parent?: string; // Dùng cho Component nằm trong Screen
  props: Record<string, any>; // Lưu text, label, status...
  
  // Traceability & Versioning (Rất quan trọng cho đồ án)
  created_in: string;
  last_changed: string;
  changed_because: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface PatchOperation {
  op: 'add_node' | 'update_node' | 'delete_node' | 'add_edge' | 'delete_edge';
  id?: string;
  node?: GraphNode;
  edge?: GraphEdge;
  props?: Record<string, any>;
}