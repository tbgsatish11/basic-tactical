import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AnalysisResult } from '../types';
import { sendChatMessage, analyzeImage } from '../services/geminiService';

export const TacticalTerminal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'INTEL'>('CHAT');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'gemini',
      text: 'Commander Gemini online. Uplink established. Waiting for situational report.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Vision State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult>({ text: '', status: 'idle' });
  const [visionPrompt, setVisionPrompt] = useState('');

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Format history for Gemini
    const history = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const responseText = await sendChatMessage(userMsg.text, history);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'gemini',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysis({ text: '', status: 'idle' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setAnalysis({ text: '', status: 'analyzing' });

    const result = await analyzeImage(selectedImage, visionPrompt);
    setAnalysis({ text: result, status: 'complete' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l-2 border-slate-700 w-96 font-mono shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
           <h2 className="text-green-500 font-bold tracking-widest">TACTICAL OS</h2>
        </div>
        <div className="text-xs text-slate-500">v3.0.PRO</div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`flex-1 p-3 text-sm font-bold transition-colors ${
            activeTab === 'CHAT' ? 'bg-slate-700 text-green-400 border-b-2 border-green-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ADVISOR
        </button>
        <button
          onClick={() => setActiveTab('INTEL')}
          className={`flex-1 p-3 text-sm font-bold transition-colors ${
            activeTab === 'INTEL' ? 'bg-slate-700 text-amber-400 border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          INTEL RECON
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* CHAT TAB */}
        {activeTab === 'CHAT' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[90%] p-3 rounded-lg text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-slate-700 text-white rounded-br-none border border-slate-600' 
                      : 'bg-green-900/30 text-green-100 rounded-bl-none border border-green-800/50'
                  }`}>
                     <div className="text-[10px] opacity-50 mb-1 uppercase tracking-wider">{msg.sender}</div>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                  <div className="flex items-start">
                      <div className="bg-green-900/30 p-3 rounded-lg rounded-bl-none border border-green-800/50">
                          <span className="text-green-500 animate-pulse text-xs">Processing Request...</span>
                      </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-800 border-t border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Request tactical support..."
                  className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-xs font-bold uppercase"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INTEL TAB */}
        {activeTab === 'INTEL' && (
          <div className="flex flex-col h-full overflow-y-auto p-4">
            <div className="mb-4">
              <label className="block text-xs font-bold text-amber-500 mb-2 uppercase">Upload Recon Image</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-amber-400 hover:file:bg-slate-600"
              />
            </div>

            {selectedImage && (
              <div className="mb-4 border border-slate-700 rounded-lg p-2 bg-black/50">
                <img src={selectedImage} alt="Recon" className="w-full h-auto rounded max-h-48 object-contain" />
              </div>
            )}

            <div className="mb-4">
                <input
                    type="text"
                    value={visionPrompt}
                    onChange={(e) => setVisionPrompt(e.target.value)}
                    placeholder="Specific instructions (optional)..."
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 mb-2"
                />
                 <button
                  onClick={handleAnalyzeImage}
                  disabled={!selectedImage || analysis.status === 'analyzing'}
                  className={`w-full py-2 rounded text-xs font-bold uppercase transition-all ${
                    !selectedImage 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                        : analysis.status === 'analyzing'
                            ? 'bg-amber-800 text-amber-200 animate-pulse'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {analysis.status === 'analyzing' ? 'Processing Satellite Data...' : 'Analyze Intel'}
                </button>
            </div>

            {analysis.status === 'complete' && (
                <div className="flex-1 bg-slate-900/50 border border-amber-900/30 rounded p-3 text-xs text-amber-100 whitespace-pre-wrap font-mono">
                    <div className="border-b border-amber-900/50 pb-2 mb-2 text-amber-500 font-bold">ANALYSIS REPORT</div>
                    {analysis.text}
                </div>
            )}
             {analysis.status === 'error' && (
                <div className="text-red-400 text-xs">Analysis Failed. Signal lost.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};