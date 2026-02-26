import { useRef, useCallback } from 'react';

const MAX_SNAPSHOTS = 20;

const useGraphUndoRedo = (cytoscapeObject) => {
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const captureSnapshot = useCallback(() => {
    if (!cytoscapeObject) return;
    const snapshot = cytoscapeObject
      .elements().jsons();
    undoStack.current.push(snapshot);
    if (undoStack.current.length > MAX_SNAPSHOTS) {
      undoStack.current.shift();
    }
    // Clear redo stack on new action
    redoStack.current = [];
  }, [cytoscapeObject]);

  const undo = useCallback(() => {
    if (
      !cytoscapeObject
      || undoStack.current.length === 0
    ) return;

    // Save current state to redo
    const current = cytoscapeObject
      .elements().jsons();
    redoStack.current.push(current);

    // Restore previous state
    const prev = undoStack.current.pop();
    cytoscapeObject.elements().remove();
    cytoscapeObject.add(prev);
  }, [cytoscapeObject]);

  const redo = useCallback(() => {
    if (
      !cytoscapeObject
      || redoStack.current.length === 0
    ) return;

    // Save current state to undo
    const current = cytoscapeObject
      .elements().jsons();
    undoStack.current.push(current);

    // Restore next state
    const next = redoStack.current.pop();
    cytoscapeObject.elements().remove();
    cytoscapeObject.add(next);
  }, [cytoscapeObject]);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  return {
    captureSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};

export default useGraphUndoRedo;
