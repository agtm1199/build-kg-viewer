/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, {
  useRef, useState, useMemo,
} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import CM from 'codemirror';
import 'codemirror/keymap/sublime';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/theme/ambiance-mobile.css';
import './CodeMirror.scss';
import PropTypes from 'prop-types';

const CYPHER_KEYWORDS = [
  'MATCH', 'RETURN', 'WHERE', 'CREATE',
  'DELETE', 'DETACH', 'SET', 'REMOVE',
  'WITH', 'ORDER', 'BY', 'LIMIT', 'SKIP',
  'OPTIONAL', 'MERGE', 'UNION', 'ALL',
  'UNWIND', 'DISTINCT', 'AS', 'AND', 'OR',
  'NOT', 'IN', 'IS', 'NULL', 'CONTAINS',
  'STARTS', 'ENDS', 'EXISTS', 'COUNT',
  'SUM', 'AVG', 'MIN', 'MAX', 'COLLECT',
  'SELECT', 'FROM', 'cypher',
];

const CodeMirrorWrapper = ({
  value, onChange, commandHistory, onClick,
  nodeLabels, edgeLabels,
}) => {
  const [commandHistoryIndex, setCommandHistoryIndex] = useState(commandHistory.length);
  const codeMirrorRef = useRef();

  const allCompletions = useMemo(() => [
    ...CYPHER_KEYWORDS.map((k) => ({
      text: k,
      className: 'cm-hint-keyword',
    })),
    ...nodeLabels.map((l) => ({
      text: l,
      displayText: `${l}  (node)`,
      className: 'cm-hint-node',
    })),
    ...edgeLabels.map((l) => ({
      text: l,
      displayText: `${l}  (edge)`,
      className: 'cm-hint-edge',
    })),
  ], [nodeLabels, edgeLabels]);

  const hintFunction = (editor) => {
    const cursor = editor.getCursor();
    const token = editor.getTokenAt(cursor);
    const word = token.string.replace(
      /^[:(]/, '',
    );
    if (word.length < 1) return null;

    const lower = word.toLowerCase();
    const matches = allCompletions.filter(
      (c) => c.text.toLowerCase()
        .startsWith(lower),
    );
    if (matches.length === 0) return null;

    return {
      list: matches,
      from: CM.Pos(
        cursor.line,
        token.end - word.length,
      ),
      to: CM.Pos(cursor.line, token.end),
    };
  };

  return (
    <CodeMirror
      id="editor"
      ref={codeMirrorRef}
      value={value}
      options={{
        keyMap: 'sublime',
        mode: 'cypher',
        placeholder: 'Create a query...',
        tabSize: 4,
        lineNumbers: true,
        spellcheck: false,
        autocorrect: false,
        autocapitalize: false,
        lineNumberFormatter: () => '$',
        hintOptions: {
          completeSingle: false,
        },
        extraKeys: {
          'Shift-Enter': (editor) => {
            onClick();
            editor.setValue('');
            setCommandHistoryIndex(-1);
          },
          'Ctrl-Enter': (editor) => {
            onClick();
            editor.setValue('');
            setCommandHistoryIndex(-1);
          },
          'Ctrl-Space': (editor) => {
            editor.showHint({
              hint: hintFunction,
              completeSingle: false,
            });
          },
          'Ctrl-Up': (editor) => {
            if (commandHistory.length === 0) {
              return;
            }
            if (commandHistoryIndex === -1) {
              const currentIdx = commandHistory.length - 1;
              editor.setValue(commandHistory[currentIdx]);
              setCommandHistoryIndex(currentIdx);
              return;
            }
            if (commandHistoryIndex === 0) {
              editor.setValue(commandHistory[0]);
              setCommandHistoryIndex(0);
              return;
            }

            editor.setValue(commandHistory[commandHistoryIndex - 1]);
            setCommandHistoryIndex(commandHistoryIndex - 1);
          },
          'Ctrl-Down': (editor) => {
            if (commandHistory.length === 0) {
              return;
            }
            if (commandHistoryIndex === -1) {
              editor.setValue('');
              return;
            }

            if (commandHistoryIndex === (commandHistory.length - 1)) {
              editor.setValue('');
              setCommandHistoryIndex(-1);
              return;
            }

            editor.setValue(commandHistory[commandHistoryIndex + 1]);
            setCommandHistoryIndex(commandHistoryIndex + 1);
          },
          Enter: (editor) => {
            editor.replaceSelection('\n', 'end');
          },
        },
      }}
      onChange={(editor) => {
        onChange(editor.getValue());
        const lineCount = editor.lineCount();
        let draggedHeight;
        let height;
        if (lineCount <= 1) {
          editor.setOption('lineNumberFormatter', () => '$');
        } else {
          editor.setOption('lineNumberFormatter', (number) => number);
          draggedHeight = document.getElementById('codeMirrorEditor').style.height;
          if (draggedHeight) {
            [height] = draggedHeight.split('px');
            if (height < (58 + 21 * lineCount)) {
              document.getElementById('codeMirrorEditor').style.height = null;
            }
          }
        }

        // Auto-trigger hints on 2+ chars
        const cursor = editor.getCursor();
        const token = editor.getTokenAt(cursor);
        const word = token.string.replace(
          /^[:(]/, '',
        );
        if (word.length >= 2) {
          editor.showHint({
            hint: hintFunction,
            completeSingle: false,
          });
        }

        return true;
      }}
    />
  );
};

CodeMirrorWrapper.defaultProps = {
  nodeLabels: [],
  edgeLabels: [],
};

CodeMirrorWrapper.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  commandHistory: PropTypes.arrayOf(
    PropTypes.string,
  ).isRequired,
  onClick: PropTypes.func.isRequired,
  nodeLabels: PropTypes.arrayOf(PropTypes.string),
  edgeLabels: PropTypes.arrayOf(PropTypes.string),
};

export default CodeMirrorWrapper;
