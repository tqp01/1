// src/agent.ts
import { GraphNode, GraphEdge, PatchOperation } from './types';

// Thuật toán Impact Analysis: Duyệt đồ thị từ Target Node để tìm các node bị ảnh hưởng (Mục 3.4)
export function getAffectedSubgraph(targetId: string, edges: GraphEdge[], depthLimit: number = 2): string[] {
  const affected = new Set<string>();
  affected.add(targetId);
  let currentLevel = [targetId];

  // Quét theo chiều rộng (BFS) dọc theo các mấu nối
  for (let i = 0; i < depthLimit; i++) {
    const nextLevel: string[] = [];
    
    for (const nodeId of currentLevel) {
      // Tìm các liên kết (edges) đi ra hoặc đi vào node hiện tại
      const connectedEdges = edges.filter(e => e.from === nodeId || e.to === nodeId);
      
      for (const edge of connectedEdges) {
        const neighbor = edge.from === nodeId ? edge.to : edge.from;
        if (!affected.has(neighbor)) {
          affected.add(neighbor);
          nextLevel.push(neighbor);
        }
      }
    }
    currentLevel = nextLevel;
  }
  
  return Array.from(affected);
}

// Multimodal Agent: Phân tích hình ảnh Wireframe (Phase 7)
// src/agent.ts
export async function generateGraphFromWireframe(imageBase64: string): Promise<{ nodes: GraphNode[], edges: GraphEdge[] }> {
    console.log(`\n[Multimodal Agent] 🖼️ Đang phân tích hình ảnh Wireframe mới bằng Vision Model...`);
    
    // Giả lập Multimodal LLM nhận diện ảnh phác thảo và sinh ra cấu trúc màn hình Shipping mới
    return {
        nodes: [
            { id: 'ShippingScreen', type: 'Screen', props: { title: 'Shipping & Delivery View' }, created_in: 'v0', last_changed: 'v0', changed_because: 'Wireframe Import' },
            { id: 'AddressInput', type: 'Component', parent: 'ShippingScreen', props: { label: 'Enter Delivery Address', placeholder: '123 Le Duan, Hanoi' }, created_in: 'v0', last_changed: 'v0', changed_because: 'Wireframe Import' },
            { id: 'ConfirmShippingBtn', type: 'Component', parent: 'ShippingScreen', props: { label: 'Confirm Shipping' }, created_in: 'v0', last_changed: 'v0', changed_because: 'Wireframe Import' },
            { id: 'R_Shipping', type: 'Requirement', props: { kind: 'explicit', text: 'User must provide a valid delivery address before proceeding.' }, created_in: 'v0', last_changed: 'v0', changed_because: 'Wireframe Import' }
        ],
        edges: [
            { from: 'ConfirmShippingBtn', to: 'AddressInput', kind: 'visible_when' },
            { from: 'ConfirmShippingBtn', to: 'R_Shipping', kind: 'implements' }
        ]
    };
}

// Hàm Agent Pipeline xử lý Intent
export async function generatePatchFromIntent(
  userPrompt: string, 
  graph: { nodes: GraphNode[], edges: GraphEdge[] }
): Promise<PatchOperation[]> {
  console.log(`\n[Agent] Bắt đầu xử lý yêu cầu: "${userPrompt}"`);

  // 1. Target Locator: Tìm node đích (Ở đây mô phỏng regex/embeddings mapping)
  let targetId = '';
  if (userPrompt.toLowerCase().includes('cancel')) {
    targetId = 'CancelButton';
  } else if (userPrompt.toLowerCase().includes('pay')) {
    targetId = 'PayButton';
  } else if (userPrompt.toLowerCase().includes('rule')) {
    targetId = 'BR04';
  }

  if (!targetId) {
    console.log(`[Agent] Không nhận diện được Target Node.`);
    return []; 
  }
  console.log(`[Agent] 1. Target Locator tìm thấy: [${targetId}]`);

  // 2. Impact Analysis: Duyệt đồ thị để trích xuất subgraph
  const affectedNodeIds = getAffectedSubgraph(targetId, graph.edges, 2);
  console.log(`[Agent] 2. Graph Traversal tìm thấy các node bị ảnh hưởng:`, affectedNodeIds);

  // 3. Patch Generator: LLM sinh ra patch dựa trên Subgraph
  console.log(`[Agent] 3. Sinh Patch Operations...`);
  
  if (userPrompt.toLowerCase().includes('rename')) {
    return [
      {
        op: 'update_node',
        id: targetId,
        props: { label: 'Cancel Order (AI Updated)' }
      }
    ];
  }

  // VD sửa Requirement / Rule kéo theo thay đổi UI
  if (targetId === 'BR04' && userPrompt.toLowerCase().includes('48 hours')) {
    return [
      {
        op: 'update_node',
        id: 'BR04',
        props: { text: 'Cancellation allowed only within 48 hours.' }
      }
    ];
  }

  return [];
}