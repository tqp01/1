import React, { useState } from 'react';

export const PrototypeCanvas = ({ graph }: { graph: any }) => {
  const [showTrace, setShowTrace] = useState(false);
  const [orderStatus, setOrderStatus] = useState('Processing');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!graph || !graph.nodes) return <div className="p-4 text-gray-500">Đang tải dữ liệu...</div>;

  const screens = graph.nodes.filter((n: any) => n.type === 'Screen');
  const selectedNode = graph.nodes.find((n: any) => n.id === selectedNodeId);

  // Helper tìm các node liên kết với 1 phần tử
  const getLinkedNodes = (nodeId: string, edgeKind: string) => {
    const edgeTargets = graph.edges.filter((e: any) => e.from === nodeId && e.kind === edgeKind).map((e: any) => e.to);
    return graph.nodes.filter((n: any) => edgeTargets.includes(n.id));
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">ProtoTrace Canvas</h2>
        <div className="flex gap-4 items-center">
          {/* Status Switcher */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
            <span className="text-sm font-semibold text-slate-600">Order status:</span>
            <select 
              value={orderStatus} 
              onChange={(e) => setOrderStatus(e.target.value)}
              className="text-sm bg-slate-100 border-none rounded p-1 outline-none font-medium"
            >
              <option value="Pending payment">Pending payment</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <button 
            onClick={() => setShowTrace(!showTrace)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${showTrace ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            {showTrace ? 'Tắt Trace Overlay' : 'Bật Trace Overlay'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {screens.map((screen: any) => {
          const components = graph.nodes.filter((n: any) => n.parent === screen.id);
          
          return (
            <div key={screen.id} className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm relative">
              <h3 className="font-semibold text-lg text-slate-700 border-b pb-2 mb-4">
                📱 {screen.props.title || screen.id}
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  {components.map((comp: any) => {
                    // Logic hiển thị theo State (Mô phỏng visible_when edge)
                    const hasVisibleRule = graph.edges.some((e: any) => e.from === comp.id && e.kind === 'visible_when');
                    if (hasVisibleRule && comp.props.requiredStatus !== orderStatus) {
                      return null; // Ẩn component nếu trạng thái không khớp
                    }

                    // Check nếu component có unresolved gap
                    const hasGap = graph.edges.some((e: any) => e.from === comp.id && e.kind === 'implements' && graph.nodes.find((n:any) => n.id === e.to && n.props.kind === 'unresolved'));

                    return (
                      <div key={comp.id} className="relative group">
                        <button 
                          onClick={() => setSelectedNodeId(comp.id)}
                          className={`px-5 py-2.5 rounded-lg shadow hover:shadow-md font-medium transition-all ${selectedNodeId === comp.id ? 'ring-2 ring-indigo-500' : ''} ${hasGap && showTrace ? 'bg-amber-100 text-amber-900 border-amber-300 border-2' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}
                        >
                          {comp.props.label || comp.id}
                        </button>
                        
                        {showTrace && getLinkedNodes(comp.id, 'implements').map((req: any, idx: number) => (
                          <span key={req.id} className={`absolute -top-3 -right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow-sm ${req.props.kind === 'unresolved' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`} style={{ right: `${idx * -15}px` }}>
                            {req.id}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Unresolved Badges Area */}
                {showTrace && graph.nodes
                  .filter((n: any) => n.type === 'Requirement' && n.props.kind === 'unresolved')
                  .map((req: any) => (
                    <div key={req.id} className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-md shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <p className="text-sm font-bold text-amber-900">{req.id} (Unresolved Business Decision)</p>
                      </div>
                      <p className="text-sm text-amber-800 mt-1 ml-7">{req.props.text}</p>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* "Why is this here?" Card Panel */}
      {selectedNode && (
        <div className="fixed bottom-6 right-6 w-96 bg-slate-800 text-white rounded-xl shadow-2xl overflow-hidden border border-slate-700 z-50">
          <div className="bg-slate-900 px-4 py-3 flex justify-between items-center border-b border-slate-700">
            <h4 className="font-semibold flex items-center gap-2">🔍 Why is this here?</h4>
            <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Target Element</p>
              <p className="font-mono text-sm bg-slate-700 inline-block px-2 py-1 rounded">{selectedNode.id}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Implements</p>
                {getLinkedNodes(selectedNode.id, 'implements').map((req:any) => (
                   <p key={req.id} className="text-sm text-blue-300 font-medium">{req.id}: {req.props.text}</p>
                ))}
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Governed By</p>
                {getLinkedNodes(selectedNode.id, 'governed_by').map((rule:any) => (
                   <p key={rule.id} className="text-sm text-purple-300 font-medium">{rule.id}: {rule.props.text}</p>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Version History</p>
              <p className="text-sm">Last changed in <span className="font-mono text-indigo-300">{selectedNode.last_changed}</span></p>
              <p className="text-sm italic text-slate-300 mt-1">"{selectedNode.changed_because}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};