import { useEffect, useRef } from 'react';
import { monaco } from '../config/monaco.js';

const THEME_NAME = 'flux-cortex-dark';
const ACCEPT_INLINE_COMMAND_ID = 'flux.inline.acceptSuggestion';
const SUPPORTED_INLINE_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'c',
  'cpp',
  'java',
  'css',
  'json',
  'html',
  'markdown',
  'plaintext',
];

let hasDefinedTheme = false;

function getFileLanguage(filename = '') {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (extension === 'js' || extension === 'jsx') return 'javascript';
  if (extension === 'ts' || extension === 'tsx') return 'typescript';
  if (extension === 'py') return 'python';
  if (extension === 'c') return 'c';
  if (extension === 'cpp' || extension === 'cc' || extension === 'cxx' || extension === 'h' || extension === 'hpp') return 'cpp';
  if (extension === 'java') return 'java';
  if (extension === 'css') return 'css';
  if (extension === 'json') return 'json';
  if (extension === 'html' || extension === 'htm') return 'html';
  if (extension === 'md') return 'markdown';
  return 'plaintext';
}

function normalizeText(value = '') {
  // ONLY normalize line endings. 
  // DO NOT trim whitespace here, as it breaks the user's ability to type spaces/tabs at the end of lines.
  return value.replace(/\r\n/g, '\n');
}

function toModelUri(filename = 'untitled.txt') {
  const safePath = filename
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return monaco.Uri.parse(`file:///workspace/${safePath}`);
}

function fromModelUri(uri) {
  return decodeURIComponent(uri.path.replace(/^\/workspace\//, ''));
}

function getSuffixPrefixOverlap(source, suggestion) {
  const sourceTail = source.slice(-Math.min(source.length, suggestion.length));
  const maxOverlap = Math.min(sourceTail.length, suggestion.length);

  for (let size = maxOverlap; size > 0; size -= 1) {
    if (sourceTail.endsWith(suggestion.slice(0, size))) {
      return size;
    }
  }

  return 0;
}

function buildInlineInsertText(model, position, suggestion) {
  const rawSuggestion = normalizeText(suggestion?.suggestedCode || '').replace(/\s+$/, '');

  if (!rawSuggestion) {
    return '';
  }

  const fullText = model.getValue();
  const cursorOffset = model.getOffsetAt(position);
  const textBeforeCursor = fullText.slice(0, cursorOffset);
  const overlap = getSuffixPrefixOverlap(textBeforeCursor, rawSuggestion);
  const insertText = rawSuggestion.slice(overlap);

  if (!insertText) {
    return '';
  }

  return insertText;
}

function buildEditorContext(model, position) {
  const content = model.getValue();
  const cursorOffset = model.getOffsetAt(position);
  // Expand window: ~1200 chars before (~30-40 lines) and ~600 chars after (~15-20 lines)
  // This gives the AI enough surrounding code to understand the function being written
  // without sending the entire 1500-line file on every trigger.
  const prefixStart = Math.max(0, cursorOffset - 1200);
  const suffixEnd = Math.min(content.length, cursorOffset + 600);

  return {
    activeFile: fromModelUri(model.uri),
    language: model.getLanguageId(),
    cursorOffset,
    cursorPrefix: content.slice(prefixStart, cursorOffset),
    cursorSuffix: content.slice(cursorOffset, suffixEnd),
  };
}

// Define the base Flux Cortex theme tokens
const BASE_TOKEN_RULES = [
  { token: 'comment', foreground: '6A9955' },
  { token: 'keyword', foreground: '569CD6' },
  { token: 'number', foreground: 'B5CEA8' },
  { token: 'string', foreground: 'CE9178' },
  { token: 'type.identifier', foreground: '4EC9B0' },
  { token: 'delimiter.bracket', foreground: 'D4D4D4' },
];

const BASE_COLORS = {
  'editor.foreground': '#d4d4d4',
  'editorLineNumber.foreground': '#5a5a5a',
  'editorLineNumber.activeForeground': '#c6c6c6',
  'editorCursor.foreground': '#f8fafc',
  'editor.selectionBackground': '#264f78',
  'editor.inactiveSelectionBackground': '#3a3d41',
  'editor.lineHighlightBackground': '#ffffff08',
  'editorIndentGuide.background1': '#ffffff12',
  'editorIndentGuide.activeBackground1': '#ffffff2e',
  'editorSuggestWidget.background': '#161616',
  'editorSuggestWidget.border': '#2a2a2a',
  'editorSuggestWidget.selectedBackground': '#1f3554',
  'editorWidget.background': '#161616',
  'editorWidget.border': '#2a2a2a',
  'editorHoverWidget.background': '#161616',
  'editorHoverWidget.border': '#2a2a2a',
};

function ensureTheme(backgroundColor = '#1e1e1e') {
  monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: BASE_TOKEN_RULES,
    colors: {
      ...BASE_COLORS,
      'editor.background': backgroundColor,
    },
  });
  monaco.editor.setTheme(THEME_NAME);
}

export default function EditorWidget({
  activeFile,
  files,
  onUpdateFile,
  aiSuggestion,
  onAcceptSuggestion,
  theme,
}) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const modelsRef = useRef(new Map());
  const viewStatesRef = useRef(new Map());
  const resizeObserverRef = useRef(null);
  const inlineTriggerFrameRef = useRef(0);
  const activeFileRef = useRef(activeFile);
  const onUpdateFileRef = useRef(onUpdateFile);
  const onAcceptSuggestionRef = useRef(onAcceptSuggestion);
  const aiSuggestionRef = useRef(aiSuggestion);

  activeFileRef.current = activeFile;
  onUpdateFileRef.current = onUpdateFile;
  onAcceptSuggestionRef.current = onAcceptSuggestion;
  aiSuggestionRef.current = aiSuggestion;

  // Track the last value sent to the parent to ignore redundant incoming sync updates
  const lastLocalValueRef = useRef(new Map());
  // Track the last value received from props to ignore our own updates bouncing back
  const lastRemoteValueRef = useRef(new Map());

  const ensureModel = (file) => {
    if (!file) {
      return null;
    }

    let model = modelsRef.current.get(file.name);
    const uri = toModelUri(file.name);
    const normalizedContent = normalizeText(file.content || '');
    const language = getFileLanguage(file.name);

    if (!model || model.isDisposed()) {
      model = monaco.editor.getModel(uri) || monaco.editor.createModel(normalizedContent, language, uri);
      modelsRef.current.set(file.name, model);
    }

    monaco.editor.setModelLanguage(model, language);

    return model;
  };

  const publishEditorState = () => {
    const editor = editorRef.current;
    const model = editor?.getModel();

    if (!editor || !model) {
      return;
    }

    const position = editor.getPosition() || model.getPositionAt(model.getValueLength());

    window.__currentCode = model.getValue();
    window.__editorContext = buildEditorContext(model, position);
  };

  const triggerInlineSuggestion = () => {
    cancelAnimationFrame(inlineTriggerFrameRef.current);

    inlineTriggerFrameRef.current = requestAnimationFrame(() => {
      const editor = editorRef.current;

      if (!editor || !aiSuggestionRef.current?.suggestedCode) {
        return;
      }

      editor.trigger('flux-ai', 'editor.action.inlineSuggest.trigger', { explicit: true });
    });
  };

  useEffect(() => {
    ensureTheme(theme?.panel || '#1e1e1e');

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const editor = monaco.editor.create(container, {
      value: '',
      language: 'javascript',
      theme: THEME_NAME,
      automaticLayout: false,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      roundedSelection: false,
      fontFamily: 'JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 15,
      lineHeight: 24,
      fontLigatures: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      tabSize: 2,
      insertSpaces: true,
      padding: {
        top: 18,
        bottom: 18,
      },
      formatOnPaste: true,
      formatOnType: true,
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      renderLineHighlight: 'all',
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      guides: {
        indentation: true,
        bracketPairs: true,
        highlightActiveIndentation: true,
      },
      inlineSuggest: {
        enabled: true,
        mode: 'subwordSmart',
        syntaxHighlightingEnabled: true,
        showToolbar: 'onHover',
      },
      suggest: {
        preview: true,
        showInlineDetails: true,
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      tabCompletion: 'on',
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    });

    editorRef.current = editor;

    const acceptCommand = monaco.editor.registerCommand(ACCEPT_INLINE_COMMAND_ID, () => {
      onAcceptSuggestionRef.current?.();
    });

    const inlineProvider = {
      provideInlineCompletions(model, position) {
        const suggestion = aiSuggestionRef.current;
        const editorInstance = editorRef.current;

        if (!suggestion?.suggestedCode || !editorInstance || model !== editorInstance.getModel()) {
          return { items: [] };
        }

        const expectedFile = suggestion.activeFile || activeFileRef.current;
        if (expectedFile && fromModelUri(model.uri) !== expectedFile) {
          return { items: [] };
        }

        const currentOffset = model.getOffsetAt(position);
        const expectedOffset = Number.isInteger(suggestion.cursorOffset)
          ? suggestion.cursorOffset
          : model.getValueLength();

        // Relaxed check: Only hide if the cursor is significantly before the suggestion point (more than 50 chars).
        // If the user types *after* the trigger, Monaco's built-in prefix matching will handle the filtering.
        if (currentOffset < expectedOffset - 50) {
          return { items: [] };
        }

        const insertText = buildInlineInsertText(model, position, suggestion);
        if (!insertText) {
          return { items: [] };
        }

        return {
          items: [
            {
              insertText,
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column,
              ),
              command: {
                id: ACCEPT_INLINE_COMMAND_ID,
                title: 'Accept Gemini Suggestion',
              },
            },
          ],
          // Keep native suggestions (IntelliSense) working for curly braces/Java/C++
          suppressSuggestions: false,
        };
      },
      disposeInlineCompletions() {},
    };

    const providerDisposables = SUPPORTED_INLINE_LANGUAGES.map((language) => (
      monaco.languages.registerInlineCompletionsProvider(language, inlineProvider)
    ));

    const editorDisposables = [
      editor.onDidChangeModelContent(() => {
        const model = editor.getModel();
        if (!model) {
          return;
        }

        const filename = fromModelUri(model.uri);
        const value = model.getValue();

        // Update local ref immediately so the incoming prop-sync knows this was OUR change
        lastLocalValueRef.current.set(filename, value);

        window.__currentCode = value;
        publishEditorState();
        onUpdateFileRef.current(filename, value);
      }),
      editor.onDidChangeCursorPosition(() => {
        publishEditorState();
        triggerInlineSuggestion();
      }),
      editor.onDidFocusEditorText(() => {
        publishEditorState();
        triggerInlineSuggestion();
      }),
      editor.onDidChangeModel(() => {
        publishEditorState();
        triggerInlineSuggestion();
      }),
    ];

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current = new ResizeObserver(() => {
        editor.layout();
      });

      resizeObserverRef.current.observe(container);
    }

    requestAnimationFrame(() => {
      editor.layout();
      publishEditorState();
      editor.focus();
    });

    return () => {
      cancelAnimationFrame(inlineTriggerFrameRef.current);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      providerDisposables.forEach((disposable) => disposable.dispose());
      editorDisposables.forEach((disposable) => disposable.dispose());
      acceptCommand.dispose();

      const currentEditor = editorRef.current;
      editorRef.current = null;
      currentEditor?.dispose();
      
      // We keep models in modelsRef to avoid flickering on re-render, 
      // they are cleaned up in the files-sync useEffect.
    };
  }, []);

  // Update theme dynamically when stress levels change (Bento background shifts)
  useEffect(() => {
    if (!theme?.panel || !editorRef.current) return;
    ensureTheme(theme.panel);
  }, [theme?.panel]);

  useEffect(() => {
    files.forEach((file) => {
      const model = ensureModel(file);
      if (!model) return;

      const normalizedIncoming = normalizeText(file.content || '');
      const currentModelValue = normalizeText(model.getValue());

      // 1. If it already matches, skip
      if (currentModelValue === normalizedIncoming) return;

      // 2. If it matches our last LOCAL update (it's our own change bouncing back), skip
      const lastLocal = normalizeText(lastLocalValueRef.current.get(file.name) || '');
      if (lastLocal === normalizedIncoming) {
        return;
      }

      // 3. If it matches what we already knew was REMOTE, skip
      const lastRemote = normalizeText(lastRemoteValueRef.current.get(file.name) || '');
      if (lastRemote === normalizedIncoming) {
        return;
      }

      // Truly different remote content (e.g. from a system event or switching files)
      lastRemoteValueRef.current.set(file.name, normalizedIncoming);

      // Surgical update (preserves selection better than model.setValue)
      model.pushStackElement();
      model.pushEditOperations(
        [],
        [{ range: model.getFullModelRange(), text: normalizedIncoming }],
        () => null,
      );
      model.pushStackElement();
    });

    const nextFileNames = new Set(files.map((file) => file.name));

    Array.from(modelsRef.current.entries()).forEach(([name, model]) => {
      if (nextFileNames.has(name)) {
        return;
      }

      if (editorRef.current?.getModel() === model) {
        editorRef.current.setModel(null);
      }

      model.dispose();
      modelsRef.current.delete(name);
      viewStatesRef.current.delete(name);
    });
  }, [files]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const nextFile = files.find((file) => file.name === activeFile) || files[0];
    if (!nextFile) {
      return;
    }

    const currentModel = editor.getModel();
    if (currentModel) {
      viewStatesRef.current.set(fromModelUri(currentModel.uri), editor.saveViewState());
    }

    const nextModel = ensureModel(nextFile);
    if (!nextModel) {
      return;
    }

    if (editor.getModel() !== nextModel) {
      editor.setModel(nextModel);
    }

    const savedViewState = viewStatesRef.current.get(nextFile.name);

    if (savedViewState) {
      editor.restoreViewState(savedViewState);
    } else {
      const endPosition = nextModel.getPositionAt(nextModel.getValueLength());
      editor.setPosition(endPosition);
      editor.revealPositionInCenterIfOutsideViewport(endPosition);
    }

    requestAnimationFrame(() => {
      editor.layout();
      publishEditorState();
      editor.focus();
      triggerInlineSuggestion();
    });
  }, [activeFile, files.length]);

  useEffect(() => {
    if (!aiSuggestion?.suggestedCode) {
      return;
    }

    triggerInlineSuggestion();
  }, [
    aiSuggestion?.suggestedCode,
    aiSuggestion?.cursorOffset,
    aiSuggestion?.activeFile,
  ]);

  return <div ref={containerRef} className="absolute inset-0 overflow-hidden" />;
}
