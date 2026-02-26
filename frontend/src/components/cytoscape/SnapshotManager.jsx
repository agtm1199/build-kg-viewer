import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import uuid from 'react-uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faCamera, faTrash,
} from '@fortawesome/free-solid-svg-icons';
import './SnapshotManager.css';

const STORAGE_KEY = 'build-kg-viewer-snapshots';
const MAX_SNAPSHOTS = 10;

const loadSnapshots = () => {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]',
    );
  } catch {
    return [];
  }
};

const saveSnapshots = (list) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(list),
  );
};

const SnapshotManager = ({
  visible,
  onClose,
  cytoscapeObject,
  cytoscapeLayout,
}) => {
  const [snapshots, setSnapshots] = useState(
    loadSnapshots,
  );
  const [naming, setNaming] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const handleSave = useCallback(() => {
    if (
      !cytoscapeObject
      || !nameInput.trim()
    ) return;
    const snap = {
      id: uuid(),
      name: nameInput.trim(),
      timestamp: Date.now(),
      layout: cytoscapeLayout,
      zoom: cytoscapeObject.zoom(),
      pan: { ...cytoscapeObject.pan() },
      elements: cytoscapeObject
        .elements().jsons(),
    };
    const updated = [snap, ...snapshots]
      .slice(0, MAX_SNAPSHOTS);
    saveSnapshots(updated);
    setSnapshots(updated);
    setNaming(false);
    setNameInput('');
  }, [
    cytoscapeObject,
    cytoscapeLayout,
    nameInput,
    snapshots,
  ]);

  const handleLoad = useCallback((snap) => {
    if (!cytoscapeObject) return;
    cytoscapeObject.elements().remove();
    cytoscapeObject.add(snap.elements);
    cytoscapeObject.zoom(snap.zoom);
    cytoscapeObject.pan(snap.pan);
  }, [cytoscapeObject]);

  const handleDelete = useCallback((id) => {
    const updated = snapshots.filter(
      (s) => s.id !== id,
    );
    saveSnapshots(updated);
    setSnapshots(updated);
  }, [snapshots]);

  const formatTime = (ts) => {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}/${
      pad(d.getDate())} ${
      pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  if (!visible) return null;

  return (
    <div className="snapshot-dropdown">
      <div className="snapshot-header">
        <span className="snapshot-title">
          <FontAwesomeIcon
            icon={faCamera}
            style={{ marginRight: 6 }}
          />
          Snapshots
        </span>
        <button
          type="button"
          className="node-detail-close"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {naming ? (
        <div className="snapshot-input-row">
          <input
            className="snapshot-input"
            placeholder="Snapshot name..."
            value={nameInput}
            onChange={(e) => setNameInput(
              e.target.value,
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setNaming(false);
              }
            }}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <button
            type="button"
            className="snapshot-confirm-btn"
            onClick={handleSave}
            disabled={!nameInput.trim()}
          >
            Save
          </button>
          <button
            type="button"
            className="snapshot-cancel-btn"
            onClick={() => setNaming(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="snapshot-save-btn"
          onClick={() => setNaming(true)}
          disabled={!cytoscapeObject}
        >
          Save Current View
        </button>
      )}

      <div className="snapshot-list">
        {snapshots.length === 0 ? (
          <div className="snapshot-empty">
            No saved snapshots
          </div>
        ) : (
          snapshots.map((snap) => (
            <div
              key={snap.id}
              className="snapshot-row"
              role="button"
              tabIndex={0}
              onClick={() => handleLoad(snap)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLoad(snap);
                }
              }}
            >
              <span className="snapshot-name">
                {snap.name}
              </span>
              <span className="snapshot-time">
                {formatTime(snap.timestamp)}
              </span>
              <button
                type="button"
                className="snapshot-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(snap.id);
                }}
                title="Delete snapshot"
              >
                <FontAwesomeIcon
                  icon={faTrash}
                />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

SnapshotManager.defaultProps = {
  cytoscapeObject: null,
  cytoscapeLayout: 'coseBilkent',
};

SnapshotManager.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
  cytoscapeLayout: PropTypes.string,
};

export default SnapshotManager;
