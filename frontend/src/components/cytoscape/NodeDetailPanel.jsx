import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import './NodeDetailPanel.css';

const NodeDetailPanel = ({
  nodeData, onClose, cytoscapeObject, graph, onCopyToEditor,
}) => {
  const [copied, setCopied] = useState(false);

  if (!nodeData) return null;
  const properties = nodeData.properties || {};
  const propEntries = Object.entries(properties);
  let edgeCount = 0;
  if (cytoscapeObject) {
    const el = cytoscapeObject.getElementById(String(nodeData.id));
    if (el.length > 0) edgeCount = el.connectedEdges().size();
  }
  const matchQuery = `SELECT * FROM cypher('${graph}', `
    + `$$ MATCH (n) WHERE id(n) = ${nodeData.id} RETURN n $$)`
    + ' as (n agtype);';

  const handleCopy = () => {
    navigator.clipboard.writeText(matchQuery).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    onCopyToEditor(matchQuery);
  };

  return (
    <div className="node-detail-panel">
      <div className="node-detail-header">
        <span
          className="node-detail-badge"
          style={{
            backgroundColor: nodeData.backgroundColor,
            color: nodeData.fontColor,
          }}
        >
          {nodeData.label}
        </span>
        <button
          type="button"
          className="node-detail-close"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="node-detail-body">
        <div className="node-detail-row">
          <span className="node-detail-key">GID</span>
          <span className="node-detail-value">
            {String(nodeData.id)}
          </span>
        </div>
        <div className="node-detail-row">
          <span className="node-detail-key">Edges</span>
          <span className="node-detail-value">{edgeCount}</span>
        </div>
        <div className="node-detail-divider" />
        {propEntries.map(([key, val]) => (
          <div key={key} className="node-detail-row">
            <span className="node-detail-key">{key}</span>
            <span className="node-detail-value">
              {typeof val === 'object'
                ? JSON.stringify(val, null, 2)
                : String(val)}
            </span>
          </div>
        ))}
      </div>
      <div className="node-detail-footer">
        <button
          type="button"
          className={
            copied
              ? 'btn btn-sm btn-success'
              : 'btn btn-sm btn-outline-dark'
          }
          onClick={handleCopy}
        >
          <FontAwesomeIcon
            icon={copied ? faCheck : faCopy}
            style={{ marginRight: 6 }}
          />
          {copied ? 'Copied!' : 'Copy Query'}
        </button>
      </div>
    </div>
  );
};

NodeDetailPanel.defaultProps = {
  nodeData: null,
  cytoscapeObject: null,
};

NodeDetailPanel.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  nodeData: PropTypes.any,
  onClose: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
  graph: PropTypes.string.isRequired,
  onCopyToEditor: PropTypes.func.isRequired,
};

export default NodeDetailPanel;
