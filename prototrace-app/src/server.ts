// src/server.ts
import express from 'express';
import cors from 'cors';
import { PrototypeEngine } from './engine';
import { generatePatchFromIntent, generateGraphFromWireframe } from './agent';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const initialNodes = [
  { id: 'OrderDetail', type: 'Screen' as const, props: { title: 'Order Detail View' }, created_in: 'v0', last_changed: 'v0', changed_because: 'Seed' },
  { id: 'CancelButton', type: 'Component' as const, parent: 'OrderDetail', props: { label: 'Cancel Order', requiredStatus: 'Processing' }, created_in: 'v0', last_changed: 'v0', changed_because: 'Seed' },
  { id: 'PayButton', type: 'Component' as const, parent: 'OrderDetail', props: { label: 'Pay Now', requiredStatus: 'Pending payment' }, created_in: 'v0', last_changed: 'v0', changed_because: 'Seed' },
  { id: 'OrderStatus', type: 'State' as const, props: { value: 'Processing' }, created_in: 'v0', last_changed: 'v0', changed_because: 'Seed' },
  { id: 'R17', type: 'Requirement' as const, props: { kind: 'explicit', text: 'User can cancel an order before shipment.' }, created_in: 'v0', last_changed: 'v0', changed_because: 'Seed' },
  { id: 'BR04', type: 'Rule' as const, props: { text: 'Cancellation allowed only within 24 hours.' }, created_in: 'v0', last_changed: 'v0', changed_because: 'Seed' },
  { id: 'U1_Gap', type: 'Requirement' as const, props: { kind: 'unresolved', text: 'What happens when user cancels after shipping?' }, created_in: 'v0', last_changed: 'v0', changed_because: 'Seed' }
];

const initialEdges = [
  { from: 'CancelButton', to: 'OrderStatus', kind: 'visible_when' as const },
  { from: 'CancelButton', to: 'R17', kind: 'implements' as const },
  { from: 'CancelButton', to: 'BR04', kind: 'governed_by' as const },
  { from: 'CancelButton', to: 'U1_Gap', kind: 'implements' as const }, // Nút Cancel bị dính unresolved gap
  { from: 'PayButton', to: 'OrderStatus', kind: 'visible_when' as const }
];

let engine = new PrototypeEngine(initialNodes, initialEdges);

app.get('/api/graph', (req, res) => {
  res.json(engine.getGraph());
});

app.get('/api/versions', (req, res) => {
  res.json(engine.getHistory());
});

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Thiếu nội dung prompt.' });
  }
  
  const operations = await generatePatchFromIntent(prompt, engine.getGraph());
  const success = engine.applyPatch(operations, prompt);

  if (!success) {
    return res.status(400).json({ error: 'Patch validation thất bại hoặc không hợp lệ.' });
  }

  res.json({
    success: true,
    message: 'Áp dụng thay đổi thành công!',
    graph: engine.getGraph()
  });
});

app.post('/api/wireframe', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const newGraphData = await generateGraphFromWireframe(imageBase64);
    
    // Khởi tạo lại engine với đồ thị mới từ wireframe
    engine = new PrototypeEngine(newGraphData.nodes, newGraphData.edges);
    
    res.json({
      success: true,
      message: 'Đã biên dịch Wireframe thành công thành Prototype Graph!',
      graph: engine.getGraph()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi xử lý wireframe.' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`[ProtoTrace Backend] Đang chạy tại cổng http://localhost:${PORT}`);
});