import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

export default function EditorWidget({ activeFile, files, onUpdateFile }) {
  // Find the exact content of the active file to pass to Monaco.
  const fileData = files ? files.find(f => f.name === activeFile) : null;
  
  // We manage the code state locally within the editor so typing is responsive,
  // and sync it up to the parent.
  const [code, setCode] = useState(fileData ? fileData.content : "");

  // Update local state when the active file changes from the outside
  useEffect(() => {
    setCode(fileData ? fileData.content : "");
    window.__currentCode = fileData ? fileData.content : "";
  }, [activeFile, fileData?.content]);

  // The local onChange handler triggers an update to the global tracking state.
  const handleEditorChange = (value) => {
    setCode(value);
    onUpdateFile(activeFile, value || "");
  };

  const getLanguage = (file) => {
    if (file.endsWith('.js') || file.endsWith('.jsx')) return 'javascript';
    if (file.endsWith('.ts') || file.endsWith('.tsx')) return 'typescript';
    if (file.endsWith('.py')) return 'python';
    if (file.endsWith('.c') || file.endsWith('.cpp') || file.endsWith('.h')) return 'cpp';
    if (file.endsWith('.java')) return 'java';
    if (file.endsWith('.css')) return 'css';
    if (file.endsWith('.json')) return 'json';
    if (file.endsWith('.html')) return 'html';
    if (file.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  return (
    <div className="flex-1 w-full relative min-h-0 bg-[#1e1e1e]">
      <Editor
        height="100%"
        width="100%"
        language={getLanguage(activeFile)}
        value={code}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 16,
          lineHeight: 28,
          smoothScrolling: true,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          padding: { top: 20, bottom: 20 },
          wordWrap: "on"
        }}
        onChange={handleEditorChange}
        className="opacity-90"
      />
    </div>
  );
}
