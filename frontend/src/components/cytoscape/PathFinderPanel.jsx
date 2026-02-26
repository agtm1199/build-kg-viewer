import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faRoute,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import './PathFinderPanel.css';

const PathFinderPanel = ({
  visible,
  onClose,
  cytoscapeObject,
  graph,
  sourceNode,
  targetNode,
  onPickSource,
  onPickTarget,
  onClearPicks,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pathResult, setPathResult] = useState(null);

  const getNodeName = (nodeData) => {
    if (!nodeData) return null;
    const p = nodeData.properties || {};
    return p.name
      || p.provision_id
      || p.title
      || p.id
      || String(nodeData.id);
  };

  const findPath = useCallback(() => {
    if (
      !cytoscapeObject
      || !sourceNode
      || !targetNode
      || !graph
    ) return;

    setLoading(true);
    setError(null);
    setPathResult(null);

    // Use AGE shortest path via BFS on
    // existing loaded graph elements
    const srcId = String(sourceNode.id);
    const tgtId = String(targetNode.id);

    // Use cytoscape's built-in BFS
    const bfs = cytoscapeObject.elements().bfs({
      roots: cytoscapeObject.getElementById(srcId),
      goal: cytoscapeObject.getElementById(tgtId),
      directed: false,
    });

    if (bfs.found) {
      const pathEles = bfs.path;

      // Highlight the path
      cytoscapeObject.elements().removeClass(
        'path-highlight',
      );
      pathEles.addClass('path-highlight');

      // Extract path steps
      const steps = [];
      pathEles.forEach((ele) => {
        if (ele.isNode()) {
          steps.push({
            type: 'node',
            id: ele.data('id'),
            label: ele.data('label'),
            name: getNodeName(ele.data()),
            bg: ele.data('backgroundColor'),
          });
        } else {
          steps.push({
            type: 'edge',
            label: ele.data('label'),
          });
        }
      });

      // Fit viewport to the path
      cytoscapeObject.animate({
        fit: { eles: pathEles, padding: 50 },
        duration: 500,
      });

      setPathResult({
        steps,
        length: steps.filter(
          (s) => s.type === 'edge',
        ).length,
      });
    } else {
      setError('No path found between these nodes.');
    }

    setLoading(false);
  }, [cytoscapeObject, sourceNode, targetNode, graph]);

  const clearPath = useCallback(() => {
    if (cytoscapeObject) {
      cytoscapeObject.elements().removeClass(
        'path-highlight',
      );
    }
    setPathResult(null);
    setError(null);
    if (onClearPicks) onClearPicks();
  }, [cytoscapeObject, onClearPicks]);

  if (!visible) return null;

  return (
    <div className="pathfinder-panel">
      <div className="pathfinder-header">
        <span className="pathfinder-title">
          <FontAwesomeIcon
            icon={faRoute}
            style={{ marginRight: 8 }}
          />
          Path Finder
        </span>
        <button
          type="button"
          className="node-detail-close"
          onClick={() => { clearPath(); onClose(); }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="pathfinder-body">
        <div className="pathfinder-field">
          <span className="pathfinder-label">
            Source Node
          </span>
          <div
            className={
              `pathfinder-node-pick${
                sourceNode ? ' filled' : ''}`
            }
            role="button"
            tabIndex={0}
            onClick={onPickSource}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onPickSource();
            }}
          >
            {sourceNode ? (
              <>
                <span
                  className="pathfinder-node-badge"
                  style={{
                    backgroundColor:
                      sourceNode.backgroundColor
                      || '#C990C0',
                  }}
                >
                  {sourceNode.label}
                </span>
                <span className="pathfinder-node-name">
                  {getNodeName(sourceNode)}
                </span>
              </>
            ) : (
              <span>Click a node in the graph</span>
            )}
          </div>
          {!sourceNode && (
            <span className="pathfinder-hint">
              Click any node to set as source
            </span>
          )}
        </div>

        <div className="pathfinder-field">
          <span className="pathfinder-label">
            Target Node
          </span>
          <div
            className={
              `pathfinder-node-pick${
                targetNode ? ' filled' : ''}`
            }
            role="button"
            tabIndex={0}
            onClick={onPickTarget}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onPickTarget();
            }}
          >
            {targetNode ? (
              <>
                <span
                  className="pathfinder-node-badge"
                  style={{
                    backgroundColor:
                      targetNode.backgroundColor
                      || '#C990C0',
                  }}
                >
                  {targetNode.label}
                </span>
                <span className="pathfinder-node-name">
                  {getNodeName(targetNode)}
                </span>
              </>
            ) : (
              <span>Click a node in the graph</span>
            )}
          </div>
          {sourceNode && !targetNode && (
            <span className="pathfinder-hint">
              Now click a second node as target
            </span>
          )}
        </div>

        <div className="pathfinder-actions">
          <button
            type="button"
            className="pathfinder-run-btn"
            disabled={
              !sourceNode || !targetNode || loading
            }
            onClick={findPath}
          >
            {loading ? 'Searching...' : 'Find Path'}
          </button>
          <button
            type="button"
            className="pathfinder-clear-btn"
            onClick={clearPath}
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="pathfinder-error">
            {error}
          </div>
        )}

        {pathResult && (
          <div className="pathfinder-result">
            <span className="pathfinder-result-title">
              {'Path Found ('}
              {pathResult.length}
              {' hops)'}
            </span>
            {pathResult.steps.map((step, idx) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                className="pathfinder-path-step"
              >
                {step.type === 'node' ? (
                  <>
                    <span
                      className="pathfinder-node-badge"
                      style={{
                        backgroundColor:
                          step.bg || '#C990C0',
                      }}
                    >
                      {step.label}
                    </span>
                    <span
                      className="pathfinder-node-name"
                    >
                      {String(step.name)
                        .substring(0, 40)}
                    </span>
                  </>
                ) : (
                  <span
                    className="pathfinder-path-arrow"
                  >
                    <FontAwesomeIcon
                      icon={faArrowRight}
                    />
                    {' '}
                    {step.label}
                    {' '}
                    <FontAwesomeIcon
                      icon={faArrowRight}
                    />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

PathFinderPanel.defaultProps = {
  cytoscapeObject: null,
  sourceNode: null,
  targetNode: null,
  onPickSource: null,
  onPickTarget: null,
  onClearPicks: null,
};

PathFinderPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
  graph: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  sourceNode: PropTypes.any,
  // eslint-disable-next-line react/forbid-prop-types
  targetNode: PropTypes.any,
  onPickSource: PropTypes.func,
  onPickTarget: PropTypes.func,
  onClearPicks: PropTypes.func,
};

export default PathFinderPanel;
