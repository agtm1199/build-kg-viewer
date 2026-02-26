import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChartBar } from '@fortawesome/free-solid-svg-icons';
import './StatisticsPanel.css';

const StatisticsPanel = ({ visible, onClose, cytoscapeObject }) => {
  const stats = useMemo(() => {
    if (!cytoscapeObject || !visible) return null;
    const nodes = cytoscapeObject.nodes();
    const edges = cytoscapeObject.edges();

    // Count by label
    const nodeCounts = {};
    nodes.forEach((n) => {
      const label = n.data('label') || 'Unknown';
      nodeCounts[label] = (nodeCounts[label] || 0) + 1;
    });

    const edgeCounts = {};
    edges.forEach((e) => {
      const label = e.data('label') || 'Unknown';
      edgeCounts[label] = (edgeCounts[label] || 0) + 1;
    });

    // Top connected nodes (by degree)
    const topNodes = nodes
      .toArray()
      .map((n) => ({
        id: n.data('id'),
        label: n.data('label'),
        name: n.data('properties')?.name
          || n.data('properties')?.provision_id
          || n.data('properties')?.id
          || String(n.data('id')),
        degree: n.degree(),
      }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 10);

    // Degree distribution
    const degreeDist = {};
    nodes.forEach((n) => {
      const d = n.degree();
      degreeDist[d] = (degreeDist[d] || 0) + 1;
    });
    const maxDeg = Math.max(
      ...Object.keys(degreeDist).map(Number), 0,
    );

    return {
      totalNodes: nodes.size(),
      totalEdges: edges.size(),
      nodeCounts,
      edgeCounts,
      topNodes,
      avgDegree: nodes.size() > 0
        ? ((2 * edges.size()) / nodes.size()).toFixed(1)
        : 0,
      maxDegree: maxDeg,
    };
  }, [cytoscapeObject, visible]);

  if (!visible || !stats) return null;

  return (
    <div className="statistics-panel">
      <div className="stats-header">
        <span className="stats-title">
          <FontAwesomeIcon
            icon={faChartBar}
            style={{ marginRight: 8 }}
          />
          Graph Statistics
        </span>
        <button
          type="button"
          className="node-detail-close"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="stats-body">
        <div className="stats-summary">
          <div className="stats-metric">
            <span className="stats-metric-value">
              {stats.totalNodes}
            </span>
            <span className="stats-metric-label">Nodes</span>
          </div>
          <div className="stats-metric">
            <span className="stats-metric-value">
              {stats.totalEdges}
            </span>
            <span className="stats-metric-label">Edges</span>
          </div>
          <div className="stats-metric">
            <span className="stats-metric-value">
              {stats.avgDegree}
            </span>
            <span className="stats-metric-label">
              Avg Degree
            </span>
          </div>
          <div className="stats-metric">
            <span className="stats-metric-value">
              {stats.maxDegree}
            </span>
            <span className="stats-metric-label">
              Max Degree
            </span>
          </div>
        </div>

        <div className="stats-section">
          <h6 className="stats-section-title">
            Nodes by Type
          </h6>
          {Object.entries(stats.nodeCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([label, count]) => (
              <div key={label} className="stats-bar-row">
                <span className="stats-bar-label">
                  {label}
                </span>
                <div className="stats-bar-track">
                  <div
                    className="stats-bar-fill"
                    style={{
                      width: `${(count / stats.totalNodes) * 100}%`,
                    }}
                  />
                </div>
                <span className="stats-bar-count">
                  {count}
                </span>
              </div>
            ))}
        </div>

        <div className="stats-section">
          <h6 className="stats-section-title">
            Edges by Type
          </h6>
          {Object.entries(stats.edgeCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([label, count]) => (
              <div key={label} className="stats-bar-row">
                <span className="stats-bar-label">
                  {label}
                </span>
                <div className="stats-bar-track">
                  <div
                    className="stats-bar-fill stats-bar-edge"
                    style={{
                      width: `${(count / stats.totalEdges) * 100}%`,
                    }}
                  />
                </div>
                <span className="stats-bar-count">
                  {count}
                </span>
              </div>
            ))}
        </div>

        <div className="stats-section">
          <h6 className="stats-section-title">
            Most Connected Nodes
          </h6>
          {stats.topNodes.map((n) => (
            <div
              key={n.id}
              className="stats-top-node"
            >
              <span className="stats-top-badge">
                {n.label}
              </span>
              <span className="stats-top-name">
                {String(n.name).substring(0, 40)}
              </span>
              <span className="stats-top-degree">
                {n.degree}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

StatisticsPanel.defaultProps = {
  cytoscapeObject: null,
};

StatisticsPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
};

export default StatisticsPanel;
