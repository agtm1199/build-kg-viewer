/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import uuid from 'react-uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faTrashAlt,
  faPaperPlane,
  faBolt,
  faSearch,
  faWrench,
  faRocket,
  faLightbulb,
  faPlay,
  faCopy,
  faArrowRight,
  faExclamationTriangle,
  faKey,
  faDatabase,
  faEye,
  faEyeSlash,
  faCheck,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import {
  addMessage,
  updateLastMessage,
  setLoading,
  setError,
  clearMessages,
  setPanel,
} from '../../features/ai/AiSlice';
import { setCommand } from '../../features/editor/EditorSlice';
import { addFrame } from '../../features/frame/FrameSlice';
import { executeCypherQuery } from '../../features/cypher/CypherSlice';
import {
  setAnthropicApiKey,
  setAiModel,
} from '../../features/setting/SettingSlice';
import './AiChatPanel.css';

const QUICK_ACTIONS = [
  {
    id: 'generate', label: 'Generate', icon: faBolt, desc: 'Describe a query',
  },
  {
    id: 'explain', label: 'Explain', icon: faSearch, desc: 'Explain editor query',
  },
  {
    id: 'fix', label: 'Fix', icon: faWrench, desc: 'Fix editor query',
  },
  {
    id: 'optimize', label: 'Optimize', icon: faRocket, desc: 'Optimize query',
  },
  {
    id: 'suggest', label: 'Suggest', icon: faLightbulb, desc: 'Suggest queries',
  },
];

function extractCodeBlocks(text) {
  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match = regex.exec(text);

  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', lang: match[1] || 'sql', content: match[2].trim() });
    lastIndex = match.index + match[0].length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}

function processSSELines(lines, dispatchFn) {
  let shouldStop = false;
  lines.forEach((line) => {
    if (shouldStop) return;
    if (!line.startsWith('data: ')) return;
    const data = line.slice(6);
    if (data === '[DONE]') {
      dispatchFn(setLoading(false));
      shouldStop = true;
      return;
    }
    try {
      const parsed = JSON.parse(data);
      if (parsed.error) {
        dispatchFn(setError(parsed.error));
        dispatchFn(setLoading(false));
        shouldStop = true;
        return;
      }
      if (parsed.text) {
        dispatchFn(updateLastMessage(parsed.text));
      }
    } catch (e) {
      // skip malformed SSE
    }
  });
  return shouldStop;
}

const AiChatPanel = () => {
  const dispatch = useDispatch();
  const {
    messages, loading, panelOpen, error,
  } = useSelector((s) => s.ai);
  const { anthropicApiKey, aiModel } = useSelector((s) => s.setting);
  const editorCommand = useSelector((s) => s.editor.command);
  const metadata = useSelector((s) => s.metadata);
  const database = useSelector((s) => s.database);

  const [input, setInput] = useState('');
  const [placeholder, setPlaceholder] = useState(
    'Ask about your graph...',
  );
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (panelOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [panelOpen]);

  if (!panelOpen) return null;

  const graphName = metadata.currentGraph || '';
  const graphMeta = metadata.graphs?.[graphName] || {};
  const nodeCount = graphMeta.nodes
    ? graphMeta.nodes.length - 1
    : 0;
  const edgeCount = graphMeta.edges
    ? graphMeta.edges.length - 1
    : 0;
  const isConnected = database.status === 'connected';
  const hasApiKey = Boolean(anthropicApiKey);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    if (!hasApiKey) {
      dispatch(setError(
        'API key not configured. Go to Settings to add your Anthropic API key.',
      ));
      return;
    }

    const userMsg = { role: 'user', content: text.trim() };
    dispatch(addMessage(userMsg));
    dispatch(addMessage({ role: 'assistant', content: '' }));
    dispatch(setLoading(true));
    dispatch(setError(null));
    setInput('');
    setPlaceholder('Ask about your graph...');

    const allMessages = [...messages, userMsg];
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          apiKey: anthropicApiKey,
          model: aiModel,
          messages: allMessages,
          graphName,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(
          () => ({ message: res.statusText }),
        );
        dispatch(setError(err.message || 'Request failed'));
        dispatch(setLoading(false));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let reading = true;

      while (reading) {
        // eslint-disable-next-line no-await-in-loop
        const chunk = await reader.read();
        if (chunk.done) {
          dispatch(setLoading(false));
          reading = false;
        } else {
          buffer += decoder.decode(
            chunk.value, { stream: true },
          );
          const lines = buffer.split('\n');
          buffer = lines.pop();
          if (processSSELines(lines, dispatch)) {
            reading = false;
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        dispatch(setError(err.message));
      }
      dispatch(setLoading(false));
    }
  };

  const handleQuickAction = (action) => {
    if (!hasApiKey) {
      dispatch(setError(
        'API key not configured. Go to Settings to add your Anthropic API key.',
      ));
      return;
    }
    switch (action.id) {
      case 'generate':
        setPlaceholder(
          'Describe the query you need...',
        );
        if (inputRef.current) inputRef.current.focus();
        break;
      case 'explain':
        if (editorCommand) {
          sendMessage(
            `Explain this query:\n\`\`\`sql\n${editorCommand}\n\`\`\``,
          );
        } else {
          setPlaceholder(
            'Put a query in the editor first...',
          );
        }
        break;
      case 'fix':
        if (editorCommand) {
          sendMessage(
            `Fix this query. It may have errors:\n\`\`\`sql\n${editorCommand}\n\`\`\``,
          );
        } else {
          setPlaceholder(
            'Put a query in the editor first...',
          );
        }
        break;
      case 'optimize':
        if (editorCommand) {
          sendMessage(
            `Optimize this query for performance:\n\`\`\`sql\n${editorCommand}\n\`\`\``,
          );
        } else {
          setPlaceholder(
            'Put a query in the editor first...',
          );
        }
        break;
      case 'suggest':
        sendMessage(
          'Suggest 5 useful queries based on the current graph schema.',
        );
        break;
      default:
        break;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleInsert = (text) => {
    dispatch(setCommand(text));
  };

  const handleRunQuery = (query) => {
    dispatch(setCommand(query));
    const refKey = uuid();
    dispatch(addFrame(query, 'CypherResultFrame', refKey));
    dispatch(executeCypherQuery([refKey, query]));
  };

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    dispatch(setLoading(false));
  };

  const renderPart = (part, msgIdx, partIdx) => {
    const key = `${msgIdx}-p${partIdx}`;
    if (part.type === 'code') {
      const codeKey = `${msgIdx}-c${partIdx}`;
      return (
        <div key={key} className="ai-code-block">
          <div className="ai-code-header">
            <span className="ai-code-lang">
              {part.lang}
            </span>
            <div className="ai-code-actions">
              {isConnected && (
                <button
                  type="button"
                  className="ai-code-run-btn"
                  onClick={
                    () => handleRunQuery(part.content)
                  }
                  title="Run this query"
                >
                  <FontAwesomeIcon icon={faPlay} />
                  <span>Run</span>
                </button>
              )}
              <button
                type="button"
                onClick={
                  () => handleInsert(part.content)
                }
                title="Insert into editor"
              >
                <FontAwesomeIcon icon={faArrowRight} />
                <span>Insert</span>
              </button>
              <button
                type="button"
                onClick={
                  () => handleCopy(part.content, codeKey)
                }
                title="Copy to clipboard"
              >
                <FontAwesomeIcon icon={faCopy} />
                <span>
                  {copiedIdx === codeKey
                    ? 'Copied!'
                    : 'Copy'}
                </span>
              </button>
            </div>
          </div>
          <pre><code>{part.content}</code></pre>
        </div>
      );
    }
    return <span key={key}>{part.content}</span>;
  };

  return (
    <div className="ai-chat-panel">
      <div className="ai-header">
        <div className="ai-header-left">
          <span className="ai-header-title">
            AI Assistant
          </span>
          <span className="ai-header-model">
            {(aiModel || '').includes('haiku')
              ? 'Haiku'
              : 'Sonnet'}
          </span>
        </div>
        <div className="ai-header-actions">
          <button
            type="button"
            className={`ai-header-btn${showSettings ? ' ai-header-btn-active' : ''}`}
            onClick={() => {
              setShowSettings(!showSettings);
              if (!showSettings) {
                setKeyDraft(anthropicApiKey || '');
                setKeySaved(false);
              }
            }}
            title="Settings"
          >
            <FontAwesomeIcon icon={faCog} />
          </button>
          <button
            type="button"
            className="ai-header-btn"
            onClick={() => dispatch(clearMessages())}
            title="Clear chat"
          >
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>
          <button
            type="button"
            className="ai-header-btn ai-close-btn"
            onClick={() => dispatch(setPanel(false))}
            title="Close"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>

      {/* Inline settings panel */}
      {showSettings && (
        <div className="ai-settings-panel">
          <div className="ai-settings-field">
            <label
              className="ai-settings-label"
              htmlFor="ai-api-key-input"
            >
              Anthropic API Key
            </label>
            <div className="ai-key-input-row">
              <div className="ai-key-input-wrap">
                <input
                  id="ai-api-key-input"
                  type={showKey ? 'text' : 'password'}
                  className="ai-settings-input"
                  value={keyDraft}
                  onChange={(e) => {
                    setKeyDraft(e.target.value);
                    setKeySaved(false);
                  }}
                  placeholder="sk-ant-api03-..."
                />
                <button
                  type="button"
                  className="ai-key-toggle"
                  onClick={() => setShowKey(!showKey)}
                  title={
                    showKey ? 'Hide key' : 'Show key'
                  }
                >
                  <FontAwesomeIcon
                    icon={showKey ? faEyeSlash : faEye}
                  />
                </button>
              </div>
              <button
                type="button"
                className={`ai-key-save-btn${keySaved ? ' saved' : ''}`}
                onClick={() => {
                  dispatch(
                    setAnthropicApiKey(keyDraft.trim()),
                  );
                  dispatch(setError(null));
                  setKeySaved(true);
                  setTimeout(
                    () => setKeySaved(false), 2000,
                  );
                }}
                disabled={keySaved}
              >
                {keySaved ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    {' Saved'}
                  </>
                ) : 'Save'}
              </button>
            </div>
          </div>
          <div className="ai-settings-field">
            <label
              className="ai-settings-label"
              htmlFor="ai-model-select"
            >
              Model
            </label>
            <select
              id="ai-model-select"
              className="ai-settings-select"
              value={aiModel || 'claude-sonnet-4-5-20250929'}
              onChange={(e) => dispatch(
                setAiModel(e.target.value),
              )}
            >
              <option value="claude-sonnet-4-5-20250929">
                Claude Sonnet 4.5
              </option>
              <option value="claude-haiku-4-5-20251001">
                Claude Haiku 4.5
              </option>
            </select>
          </div>
        </div>
      )}

      {/* Schema context indicator */}
      {isConnected && graphName ? (
        <div className="ai-context-bar">
          <FontAwesomeIcon
            icon={faDatabase}
            className="ai-context-icon"
          />
          <span className="ai-context-text">
            <strong>{graphName}</strong>
            {nodeCount > 0 || edgeCount > 0 ? (
              <span className="ai-context-meta">
                {nodeCount}
                {' nodes, '}
                {edgeCount}
                {' edges'}
              </span>
            ) : null}
          </span>
        </div>
      ) : (
        <div className="ai-context-bar ai-context-warn">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="ai-context-icon"
          />
          <span className="ai-context-text">
            No graph connected
          </span>
        </div>
      )}

      {/* Quick actions */}
      <div className="ai-quick-actions">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            className="ai-action-chip"
            onClick={() => handleQuickAction(a)}
            disabled={loading}
            title={a.desc}
          >
            <FontAwesomeIcon
              icon={a.icon}
              className="ai-chip-icon"
            />
            {a.label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="ai-error-banner">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => dispatch(setError(null))}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Message body */}
      <div className="ai-body" ref={bodyRef}>
        {messages.length === 0 && !error && (
          <div className="ai-empty">
            {!hasApiKey ? (
              <>
                <div className="ai-empty-icon">
                  <FontAwesomeIcon icon={faKey} />
                </div>
                <div className="ai-empty-title">
                  API Key Required
                </div>
                <div className="ai-empty-subtitle">
                  Add your Anthropic API key to enable
                  AI query assistance.
                </div>
                <button
                  type="button"
                  className="ai-configure-btn"
                  onClick={() => {
                    setShowSettings(true);
                    setKeyDraft('');
                    setKeySaved(false);
                  }}
                >
                  <FontAwesomeIcon icon={faCog} />
                  {' Configure API Key'}
                </button>
              </>
            ) : (
              <>
                <div className="ai-empty-icon">
                  <FontAwesomeIcon icon={faBolt} />
                </div>
                <div className="ai-empty-title">
                  AI Query Assistant
                </div>
                <div className="ai-empty-subtitle">
                  Generate, explain, fix, or optimize
                  Apache AGE Cypher queries.
                  {graphName
                    ? ` Schema-aware for "${graphName}".`
                    : ' Connect to a database for schema-aware queries.'}
                </div>
              </>
            )}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            className={`ai-message ai-message-${msg.role}`}
          >
            <div className="ai-message-role">
              {msg.role === 'user' ? 'You' : 'AI'}
            </div>
            {msg.role === 'assistant' ? (
              <div className="ai-message-content">
                {extractCodeBlocks(msg.content).map(
                  (part, j) => renderPart(part, idx, j),
                )}
                {loading
                  && msg === messages[messages.length - 1]
                  && msg.content === '' && (
                  <div className="ai-typing">
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                  </div>
                )}
              </div>
            ) : (
              <div className="ai-message-content">
                {msg.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stop generating */}
      {loading && (
        <div className="ai-stop-area">
          <button
            type="button"
            className="ai-stop-btn"
            onClick={handleStop}
          >
            Stop generating
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="ai-input-area">
        <textarea
          ref={inputRef}
          className="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={loading || !hasApiKey}
        />
        <button
          type="button"
          className="ai-send-btn"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading || !hasApiKey}
          title="Send (Enter)"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </div>
  );
};

export default AiChatPanel;
