/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Settings, 
  Shuffle, 
  Copy, 
  Trash2, 
  Users2, 
  Grid2X2,
  CheckCircle2,
  Plus
} from 'lucide-react';

type GroupingMode = 'count' | 'size';

interface Group {
  id: number;
  members: string[];
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<GroupingMode>('count');
  const [value, setValue] = useState(2);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file, 'UTF-8'); // Explicitly set UTF-8 encoding
    e.target.value = '';
  };

  const handleExportCSV = () => {
    if (groups.length === 0) return;

    // Build CSV content in UTF-8
    let csvContent = '\uFEFF'; // Add BOM for Excel UTF-8 support
    csvContent += '組別,代號 姓名\n';
    
    groups.forEach(group => {
      group.members.forEach(member => {
        csvContent += `第 ${group.id} 組,${member}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `分組結果_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Optional: If you want to FORCE only Chinese during typing
    // const value = e.target.value.replace(/[^\u4e00-\u9fa5\s]/g, '');
    // setInputText(value);
    setInputText(e.target.value);
  };

  const members = useMemo(() => {
    return inputText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // More robust splitting that handles CSV-style quotes and common delimiters
        // It splits by comma, tab, semicolon or space, taking care to ignore extra whitespace
        const parts = line.split(/[,\s\t;]+/)
          .map(p => p.trim().replace(/^["']|["']$/g, '')) // Remove surrounding quotes
          .filter(p => p.length > 0);
        
        if (parts.length >= 2) {
          const id = parts[0];
          const name = parts[1];
          // Return formatted as "ID Name", exactly the text inside fields
          return `${id} ${name}`;
        }
        return line;
      });
  }, [inputText]);

  const handleGroup = () => {
    if (members.length === 0) return;

    const shuffled = [...members].sort(() => Math.random() - 0.5);
    const result: Group[] = [];

    if (mode === 'count') {
      // Divide into X groups
      const groupCount = Math.max(1, Math.min(value, members.length));
      for (let i = 0; i < groupCount; i++) {
        result.push({ id: i + 1, members: [] });
      }
      shuffled.forEach((member, index) => {
        result[index % groupCount].members.push(member);
      });
    } else {
      // Groups of X people
      const groupSize = Math.max(1, value);
      for (let i = 0; i < shuffled.length; i += groupSize) {
        result.push({
          id: result.length + 1,
          members: shuffled.slice(i, i + groupSize)
        });
      }
    }

    setGroups(result);
  };

  const copyResults = () => {
    if (groups.length === 0) return;
    
    const text = groups
      .map(g => `【第 ${g.id} 組】\n${g.members.join('\n')}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const clearAll = () => {
    setInputText('');
    setGroups([]);
  };

  const groupColors = [
    'bg-[#FF914D]', // Orange
    'bg-[#CB6CE6]', // Purple
    'bg-[#5DE2E7]', // Cyan
    'bg-[#FFBD59]', // Light Orange
    'bg-[#7ED957]', // Green
    'bg-[#FF5757]', // Red
  ];

  return (
    <div className="min-h-screen font-sans p-6 md:p-12 selection:bg-black selection:text-[#FFDE59]">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
          <div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none drop-shadow-sm">
              智慧分組助手
            </h1>
            <p className="text-xl font-bold opacity-80 uppercase tracking-[0.2em] mt-2 italic">
              Smart Grouping Tool v2.0
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white brutal-border px-6 py-3 rounded-2xl brutal-shadow">
              <span className="block text-[10px] font-black opacity-50 uppercase tracking-wider mb-1">Total Members</span>
              <span className="text-3xl font-black tabular-nums">{members.length} 人</span>
            </div>
            <div className="bg-white brutal-border px-6 py-3 rounded-2xl brutal-shadow">
              <span className="block text-[10px] font-black opacity-50 uppercase tracking-wider mb-1">Group Count</span>
              <span className="text-3xl font-black tabular-nums">{groups.length} 組</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sidebar: Controls */}
          <motion.div 
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:col-span-4 space-y-8"
          >
            {/* Input Section */}
            <div className="bg-white brutal-border rounded-[2.5rem] p-8 brutal-shadow-lg space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-2xl font-black flex items-center gap-3 italic uppercase tracking-tight">
                  <span className="bg-[#FF5757] w-4 h-4 rounded-full animate-pulse"></span> 
                  成員名單 (代號, 姓名)
                </label>
              </div>
              <textarea
                value={inputText}
                onChange={handleTextChange}
                placeholder="輸入格式：代號 姓名\n可用分隔符：空格、逗號、Tab\n例如：\nA001 王小明\nA002,李小美"
                className="w-full h-80 p-6 rounded-2xl bg-[#F0F0F0] border-4 border-black font-mono text-sm leading-relaxed focus:bg-white transition-all outline-none resize-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={clearAll}
                  className="bg-[#5DE2E7] brutal-border py-4 px-4 rounded-xl font-black brutal-shadow uppercase text-sm brutal-btn-hover hover:brightness-105 active:translate-y-1 active:shadow-none"
                >
                  清空名單
                </button>
                <div className="relative">
                  <input
                    type="file"
                    id="fileInput"
                    accept=".txt,.csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                  <button 
                    className="w-full bg-[#7ED957] brutal-border py-4 px-4 rounded-xl font-black brutal-shadow uppercase text-sm brutal-btn-hover hover:brightness-105 active:translate-y-1 active:shadow-none"
                  >
                    導入文件
                  </button>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="bg-white brutal-border rounded-[2.5rem] p-8 brutal-shadow-lg space-y-8">
              <div className="flex items-center gap-3 text-2xl font-black italic uppercase tracking-tight">
                <span className="bg-[#5DE2E7] w-4 h-4 rounded-full"></span>
                分組設定
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-2 bg-[#F0F0F0] brutal-border rounded-2xl">
                  <button
                    onClick={() => setMode('count')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      mode === 'count' 
                        ? 'bg-black text-white shadow-md' 
                        : 'text-slate-400 hover:text-black'
                    }`}
                  >
                    固定組數
                  </button>
                  <button
                    onClick={() => setMode('size')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      mode === 'size' 
                        ? 'bg-black text-white shadow-md' 
                        : 'text-slate-400 hover:text-black'
                    }`}
                  >
                    每組人數
                  </button>
                </div>

                <div className="px-1">
                  <div className="flex justify-between font-black uppercase text-xs mb-4">
                    <span className="opacity-60">{mode === 'count' ? 'Groups' : 'Size'}</span>
                    <span className="text-[#CB6CE6] text-xl">{value}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={members.length || 10}
                    value={value}
                    onChange={(e) => setValue(parseInt(e.target.value))}
                    className="w-full h-8 bg-black rounded-lg appearance-none cursor-pointer accent-[#CB6CE6] p-1 border-2 border-black"
                  />
                </div>
              </div>

              <button
                onClick={handleGroup}
                disabled={members.length === 0}
                className="w-full py-6 bg-[#1A1A1A] text-white border-4 border-black rounded-[1.5rem] font-black shadow-[4px_4px_0px_0px_rgba(255,255,100,0.4)] flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] brutal-btn-hover"
              >
                <span className="text-3xl">⚡</span>
                <span className="font-black uppercase tracking-widest text-xs">立即分組 / RESET</span>
              </button>
            </div>
          </motion.div>

          {/* Main: Results */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 space-y-8"
          >
            <div className="flex items-center justify-between px-4">
              <h2 className="text-3xl font-black uppercase tracking-tight italic flex items-center gap-4">
                分組結果
                {groups.length > 0 && <span className="bg-black text-white text-[10px] px-3 py-1 rounded-full not-italic">{groups.length} UNITS</span>}
              </h2>
              {groups.length > 0 && (
                <button
                  onClick={copyResults}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white px-6 py-3 rounded-xl brutal-border brutal-shadow brutal-btn-hover"
                >
                  {isCopied ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 已複製</>
                  ) : (
                    <><Copy className="w-4 h-4" /> 複製名單</>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {groups.length > 0 ? (
                  groups.map((group, idx) => (
                    <motion.div
                      key={group.id}
                      layout
                      initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: 'spring', damping: 15 }}
                      className={`${groupColors[idx % groupColors.length]} brutal-border rounded-2xl p-6 brutal-shadow flex flex-col h-full`}
                    >
                      <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-3">
                        <span className="font-black text-xl uppercase italic">第 {group.id} 組</span>
                        <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded">
                          {group.members.length} PPL
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {group.members.map((member, mIdx) => (
                          <motion.li 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: mIdx * 0.05 }}
                            key={mIdx} 
                            className="bg-white/40 brutal-border border-2 px-4 py-2.5 rounded-lg text-black font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            {member}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-40 bg-white/20 brutal-border border-dashed border-4 rounded-3xl flex flex-col items-center justify-center gap-6">
                    <div className="w-24 h-24 bg-white/40 rounded-full flex items-center justify-center border-4 border-black brutal-shadow">
                      <Users className="w-12 h-12" />
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black uppercase tracking-widest italic opacity-50 italic">尚未生成分組</p>
                      <p className="text-sm font-bold opacity-30 mt-2">READY TO SHUFFLE? ENTER NAMES ABOVE.</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="mt-12 flex flex-col md:flex-row justify-between items-center bg-black text-white px-10 py-6 rounded-3xl brutal-shadow-lg gap-6">
          <div className="flex gap-12 font-black italic uppercase text-[10px] tracking-widest">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7ED957]"></span>
              Strategy: Random Shuffle
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5DE2E7]"></span>
              Balance: Optimized
            </span>
          </div>
          <button 
            onClick={handleExportCSV}
            className="bg-white text-black px-8 py-3 rounded-full font-black text-xs hover:bg-[#FFDE59] transition-all brutal-btn-hover uppercase tracking-widest"
          >
            匯出 CSV (UTF-8)
          </button>
        </footer>
      </div>
    </div>
  );
}
