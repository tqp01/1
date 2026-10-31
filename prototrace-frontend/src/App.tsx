import React, { useEffect, useState } from 'react';
import { PrototypeCanvas } from './PrototypeCanvas';

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

interface VersionItem {
  version: string;
  reason: string;
  timestamp: string;
}

function App() {
  const [graph, setGraph] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'agent', text: 'Xin chào BA! Hãy nhập yêu cầu thay đổi giao diện hoặc nghiệp vụ bên dưới.' }
  ]);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'versions' | 'wireframe'>('chat');
  
  // State quản lý hiển thị Pop-up Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000); // Tự động ẩn sau 3 giây
  };

  const fetchData = async () => {
    try {
      const resGraph = await fetch('http://localhost:4000/api/graph');
      const dataGraph = await resGraph.json();
      setGraph(dataGraph);

      const resVer = await fetch('http://localhost:4000/api/versions');
      const dataVer = await resVer.json();
      setVersions(dataVer);
    } catch (error) {
      console.error("Lỗi kết nối Backend:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userText = prompt;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setPrompt('');

    try {
      const res = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText }),
      });
      const data = await res.json();
      
      if (data.success) {
        setGraph(data.graph);
        setMessages(prev => [...prev, { sender: 'agent', text: `✅ Đã cập nhật thành công lên phiên bản mới!` }]);
        showToast("🚀 Đã áp dụng thay đổi và cập nhật phiên bản thành công!");
        fetchData();
      } else {
        showToast("❌ Không thể thực hiện yêu cầu này.");
      }
    } catch (error) {
      console.error("Lỗi gửi yêu cầu:", error);
      showToast("⚠️ Lỗi kết nối tới Backend server.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans relative">
      
      {/* POP-UP TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <span className="text-indigo-400 font-bold">✨</span>
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Cột trái: Điều khiển (Chat, Version Timeline & Wireframe Upload) */}
      <div className="w-1/3 border-r border-slate-200 bg-white p-6 flex flex-col shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          🤖 ProtoTrace Studio
        </h1>

        {/* Tab Switcher 3 chức năng */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Chat
          </button>
          <button 
            onClick={() => setActiveTab('versions')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'versions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Versions ({versions.length})
          </button>
          <button 
            onClick={() => setActiveTab('wireframe')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'wireframe' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Wireframe
          </button>
        </div>
        
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white ml-6' : 'bg-white text-slate-700 border border-slate-200 mr-6 shadow-sm'}`}
                >
                  <p className="font-semibold text-[11px] opacity-70 mb-0.5">
                    {msg.sender === 'user' ? 'Business Analyst' : 'ProtoTrace Agent'}
                  </p>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="VD: Rename cancel button..."
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm">
                Gửi
              </button>
            </form>
          </>
        )}

        {activeTab === 'versions' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <p className="text-xs text-slate-500 mb-2">Lịch sử thay đổi semantic graph theo từng phiên bản:</p>
            {versions.map((ver, index) => (
              <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-indigo-600 text-sm px-2 py-0.5 bg-indigo-50 rounded border border-indigo-100">
                    {ver.version}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(ver.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 font-medium">Trigger/Reason:</p>
                <p className="text-sm text-slate-900 bg-white p-2 rounded border border-slate-100 mt-0.5 italic">
                  "{ver.reason}"
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'wireframe' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <p className="text-xs text-slate-500">Tải lên ảnh phác thảo (Wireframe/Figma) để AI tự động biên dịch thành Prototype Graph khởi tạo:</p>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
              <input 
                type="file" 
                accept="image/*" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (uploadEvent) => {
                    const base64 = uploadEvent.target?.result as string;
                    try {
                      const res = await fetch('http://localhost:4000/api/wireframe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageBase64: base64 })
                      });
                      const data = await res.json();
                      if (data.success) {
                        setGraph(data.graph);
                        fetchData();
                        showToast("🖼️ Phân tích Wireframe và khởi tạo Prototype thành công!");
                      }
                    } catch (err) {
                      console.error("Lỗi upload wireframe:", err);
                      showToast("❌ Lỗi khi xử lý hình ảnh.");
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Cột phải: Prototype Canvas */}
      <div className="w-2/3 overflow-y-auto">
        <PrototypeCanvas graph={graph} />
      </div>
    </div>
  );
}

export default App;