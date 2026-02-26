import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { seletableLayouts } from './CytoscapeLayouts';
import './KeyboardShortcuts.css';

const layoutKeys = Object.keys(seletableLayouts);

export const useKeyboardShortcuts = ({
  cytoscapeObject,
  cytoscapeLayout,
  setCytoscapeLayout,
  onFocusSearch,
  onShowHelp,
  onUndo,
  onRedo,
  onBeforeRemove,
}) => {
  const handler = useCallback((e) => {
    // Ctrl+Z / Ctrl+Shift+Z work everywhere
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey && onRedo) onRedo();
      else if (onUndo) onUndo();
      return;
    }

    const tag = e.target.tagName;
    const editable = (
      tag === 'INPUT'
      || tag === 'TEXTAREA'
      || tag === 'SELECT'
      || e.target.isContentEditable
    );
    if (editable) {
      if (e.key === 'Escape') e.target.blur();
      return;
    }
    if (!cytoscapeObject) return;

    switch (e.key) {
      case 'f':
      case 'F':
        cytoscapeObject.fit(
          cytoscapeObject.elements(), 30,
        );
        break;
      case 'Escape':
        cytoscapeObject.elements(':selected')
          .unselect().selectify();
        break;
      case 'h':
      case 'H':
        if (onBeforeRemove) onBeforeRemove();
        cytoscapeObject.elements(':selected')
          .remove();
        break;
      case 'Delete':
      case 'Backspace':
        if (onBeforeRemove) onBeforeRemove();
        cytoscapeObject.elements(':selected')
          .remove();
        break;
      case 'l':
      case 'L': {
        const idx = layoutKeys.indexOf(
          cytoscapeLayout,
        );
        const next = layoutKeys[
          (idx + 1) % layoutKeys.length
        ];
        setCytoscapeLayout(next);
        break;
      }
      case '?':
        onShowHelp();
        break;
      case '/':
        e.preventDefault();
        onFocusSearch();
        break;
      default:
        break;
    }
  }, [
    cytoscapeObject,
    cytoscapeLayout,
    setCytoscapeLayout,
    onFocusSearch,
    onShowHelp,
    onUndo,
    onRedo,
    onBeforeRemove,
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handler]);
};

const SHORTCUTS = [
  ['F', 'Fit graph to viewport'],
  ['Esc', 'Deselect all nodes/edges'],
  ['H', 'Hide selected elements'],
  ['Del', 'Remove selected elements'],
  ['L', 'Cycle through layouts'],
  ['/', 'Focus search bar'],
  ['Ctrl+Z', 'Undo'],
  ['Ctrl+Shift+Z', 'Redo'],
  ['?', 'Show this help'],
];

export const ShortcutsHelpOverlay = ({ visible, onClose }) => {
  if (!visible) return null;
  return (
    /* eslint-disable jsx-a11y/click-events-have-key-events */
    /* eslint-disable jsx-a11y/no-static-element-interactions */
    <div className="shortcuts-overlay" onClick={onClose}>
      <div
        className="shortcuts-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h5 style={{ marginBottom: 16, fontWeight: 600 }}>Keyboard Shortcuts</h5>
        <table className="shortcuts-table">
          <tbody>
            {SHORTCUTS.map(([key, desc]) => (
              <tr key={key}>
                <td><kbd>{key}</kbd></td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="btn btn-sm btn-outline-dark mt-3"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

ShortcutsHelpOverlay.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
