import { useState } from 'react';
import { Files, Search, GitBranch, Terminal, ChevronDown, Check, Folder, FileJson, FileCode2, Plus, X, Trash2 } from 'lucide-react';

export default function SidebarWidget({ activeFile, setActiveFile, files = [], onCreateFile, onDeleteFile }) {
  const [activeTab, setActiveTab] = useState('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [commitMessage, setCommitMessage] = useState('');

  const getFileIcon = (filename) => {
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return <FileCode2 size={14} className="text-yellow-400" />;
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return <FileCode2 size={14} className="text-blue-400" />;
    if (filename.endsWith('.json')) return <FileJson size={14} className="text-green-400" />;
    if (filename.endsWith('.css')) return <Terminal size={14} className="text-sky-400" />;
    if (filename.endsWith('.py')) return <FileCode2 size={14} className="text-blue-400" />;
    if (filename.endsWith('.c') || filename.endsWith('.cpp') || filename.endsWith('.h') || filename.endsWith('.cc')) return <FileCode2 size={14} className="text-purple-400" />;
    if (filename.endsWith('.java')) return <FileCode2 size={14} className="text-orange-400" />;
    if (filename.endsWith('.go')) return <FileCode2 size={14} className="text-cyan-400" />;
    if (filename.endsWith('.rs')) return <FileCode2 size={14} className="text-orange-300" />;
    if (filename.endsWith('.rb')) return <FileCode2 size={14} className="text-red-400" />;
    if (filename.endsWith('.sh')) return <Terminal size={14} className="text-green-400" />;
    if (filename.endsWith('.md')) return <Files size={14} className="text-slate-200" />;
    if (filename.endsWith('.html') || filename.endsWith('.htm')) return <FileCode2 size={14} className="text-orange-500" />;
    return <Terminal size={14} className="text-slate-300" />;
  };

  const renderContent = () => {
    if (activeTab === 'files') {
      return (
        <div className="flex flex-col gap-0 w-full text-base pb-8">
          <div className="px-4 py-3 text-sm font-bold tracking-wider uppercase opacity-70 mb-1 flex items-center justify-between group text-white">
            <span>Explorer</span>
            <button 
              onClick={onCreateFile} 
              className="opacity-50 hover:opacity-100 p-0.5 hover:bg-white/20 hover:text-white rounded transition-all cursor-pointer"
              title="New File"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div className="flex flex-col pb-2">
            <div className="flex items-center gap-1 opacity-80 py-1.5 px-2 hover:bg-white/5 cursor-pointer transition-colors">
              <ChevronDown size={14} className="opacity-70" />
              <Folder size={14} className="text-blue-400" />
              <span className="font-semibold tracking-wide">src</span>
            </div>
            {files.filter(f => !f.name.includes('.test.')).map(f => (
              <div
                key={f.name}
                onClick={() => setActiveFile(f.name)}
                className={`group flex items-center gap-2 py-1 px-2 pl-8 cursor-pointer transition-colors ${activeFile === f.name ? 'opacity-100 bg-blue-500/20 text-blue-200 border-l-2 border-blue-500' : 'opacity-80 hover:bg-white/5 border-l-2 border-transparent'}`}
              >
                {getFileIcon(f.name)}
                <span className="flex-1 truncate text-xs">{f.name}</span>
                {onDeleteFile && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteFile(f.name); }}
                    title={`Delete ${f.name}`}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-all shrink-0"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col mt-2">
            <div className="flex items-center gap-1 opacity-80 py-1.5 px-2 hover:bg-white/5 cursor-pointer transition-colors">
              <ChevronDown size={14} className="opacity-70" />
              <Folder size={14} className="text-blue-400" />
              <span className="font-semibold tracking-wide">tests</span>
            </div>
            {files.filter(f => f.name.includes('.test.')).map(f => (
              <div
                key={f.name}
                onClick={() => setActiveFile(f.name)}
                className={`group flex items-center gap-2 py-1 px-2 pl-8 cursor-pointer transition-colors ${activeFile === f.name ? 'opacity-100 bg-blue-500/20 text-blue-200 border-l-2 border-blue-500' : 'opacity-80 hover:bg-white/5 border-l-2 border-transparent'}`}
              >
                {getFileIcon(f.name)}
                <span className="flex-1 truncate text-xs">{f.name}</span>
                {onDeleteFile && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteFile(f.name); }}
                    title={`Delete ${f.name}`}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-all shrink-0"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (activeTab === 'search') {
      return (
        <div className="flex flex-col gap-3 w-full text-sm">
          <div className="px-4 py-3 text-xs font-bold tracking-wider uppercase opacity-70 mb-1">Search</div>
          <div className="px-4 flex flex-col gap-2">
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full bg-black/40 border border-white/10 rounded-sm px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono placeholder:font-sans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Replace" 
              className="w-full bg-black/40 border border-white/10 rounded-sm px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono placeholder:font-sans"
            />
            {searchQuery && (
              <div className="mt-4 text-xs opacity-50 px-1 border-t border-white/10 pt-4">
                No results found for '{searchQuery}'.
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'git') {
      return (
        <div className="flex flex-col gap-2 w-full text-sm">
          <div className="px-4 py-3 pb-1 text-sm font-bold tracking-wider uppercase opacity-70 mb-1 flex items-center justify-between">
            <span>Source Control</span>
            <div className="bg-blue-500/20 text-blue-300 rounded-full px-2 py-0.5 text-xs leading-tight">1</div>
          </div>
          <div className="px-4 flex flex-col gap-2">
            <textarea 
              placeholder="Message (Ctrl+Enter to commit)" 
              className="w-full bg-black/40 border border-white/10 rounded-sm px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none h-20 font-mono placeholder:font-sans"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            ></textarea>
            <button className="flex items-center justify-center gap-1.5 w-full bg-[#007ACC] hover:bg-[#005A9E] text-white rounded-sm py-1.5 text-sm font-semibold transition-colors shadow-sm cursor-pointer">
              <Check size={14} /> Commit
            </button>
          </div>
          
          <div className="mt-4 flex flex-col gap-0 border-t border-white/10 pt-2">
            <div className="flex items-center gap-1 opacity-80 py-1.5 px-2 cursor-pointer hover:bg-white/5 transition-colors">
              <ChevronDown size={14} className="opacity-70" />
              <span className="font-bold text-xs uppercase tracking-wider">Changes</span>
            </div>
            <div className={`flex items-center gap-2 py-1 px-2 pl-8 cursor-pointer transition-colors opacity-80 hover:bg-white/5 border-l-2 border-transparent hover:border-white/20`}>
              <Terminal size={14} className="text-yellow-400" />
              <span>App.jsx</span>
              <span className="ml-auto text-yellow-500 text-xs uppercase font-bold pr-2 bg-yellow-500/20 px-1 rounded-sm">M</span>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex h-full w-full bg-[#1e1e1e]/80 text-[#cccccc] font-sans">
      {/* VSCode Activity Bar */}
      <div className="w-12 border-r border-[#333333] flex flex-col items-center py-4 gap-6 bg-[#181818]/90 z-10 shrink-0">
        <div 
          onClick={() => setActiveTab('files')}
          className={`p-2 cursor-pointer transition-all relative group`}
          title="Explorer (Shift+Cmd+E)"
        >
          {activeTab === 'files' && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500 rounded-r shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
          <Files size={24} className={activeTab === 'files' ? 'text-white' : 'text-[#858585] group-hover:text-white'} strokeWidth={activeTab === 'files' ? 2 : 1.5} />
        </div>
        <div 
          onClick={() => setActiveTab('search')}
          className={`p-2 cursor-pointer transition-all relative group`}
          title="Search (Shift+Cmd+F)"
        >
          {activeTab === 'search' && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500 rounded-r shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
          <Search size={24} className={activeTab === 'search' ? 'text-white' : 'text-[#858585] group-hover:text-white'} strokeWidth={activeTab === 'search' ? 2 : 1.5} />
        </div>
        <div 
          onClick={() => setActiveTab('git')}
          className={`p-2 cursor-pointer transition-all relative group`}
          title="Source Control (Ctrl+Shift+G)"
        >
          {activeTab === 'git' && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500 rounded-r shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
          <GitBranch size={24} className={activeTab === 'git' ? 'text-white' : 'text-[#858585] group-hover:text-white'} strokeWidth={activeTab === 'git' ? 2 : 1.5} />
          <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white border border-[#181818] rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold pb-[1px] shadow-sm">1</div>
        </div>
      </div>

      {/* VSCode Side Bar Content */}
      <div className="flex-1 bg-[#252526]/80 flex flex-col overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
