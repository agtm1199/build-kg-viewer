import React, {
  useState, useCallback, useRef,
} from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faBrain,
} from '@fortawesome/free-solid-svg-icons';
import './AlgorithmsPanel.css';

const ALGORITHMS = [
  {
    key: 'pageRank',
    label: 'PageRank',
    desc: 'Importance based on connections',
  },
  {
    key: 'betweenness',
    label: 'Betweenness Centrality',
    desc: 'Bridge nodes between groups',
  },
  {
    key: 'closeness',
    label: 'Closeness Centrality',
    desc: 'How close to all other nodes',
  },
  {
    key: 'degree',
    label: 'Degree Centrality',
    desc: 'Number of connections',
  },
];

const scoreToColor = (score) => {
  // 0.0 → blue (#3498db)
  // 0.5 → yellow (#f1c40f)
  // 1.0 → red (#e74c3c)
  let r;
  let g;
  let b;
  if (score <= 0.5) {
    const t = score * 2;
    r = Math.round(52 + t * (241 - 52));
    g = Math.round(152 + t * (196 - 152));
    b = Math.round(219 + t * (15 - 219));
  } else {
    const t = (score - 0.5) * 2;
    r = Math.round(241 + t * (231 - 241));
    g = Math.round(196 + t * (76 - 196));
    b = Math.round(15 + t * (60 - 15));
  }
  return `rgb(${r},${g},${b})`;
};

const AlgorithmsPanel = ({
  visible,
  onClose,
  cytoscapeObject,
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState(
    'pageRank',
  );
  const [computing, setComputing] = useState(false);
  const [results, setResults] = useState(null);
  const [heatMapActive, setHeatMapActive] = useState(
    false,
  );
  const origStyles = useRef(new Map());

  const getNodeName = (n) => {
    const p = n.data('properties') || {};
    return p.name
      || p.provision_id
      || p.title
      || p.id
      || String(n.data('id'));
  };

  const runAlgorithm = useCallback(() => {
    if (!cytoscapeObject) return;
    setComputing(true);
    setResults(null);
    setHeatMapActive(false);

    // Use setTimeout to let UI update
    setTimeout(() => {
      const nodes = cytoscapeObject.nodes();
      const eles = cytoscapeObject.elements();
      const scores = new Map();

      if (selectedAlgo === 'pageRank') {
        const pr = eles.pageRank();
        nodes.forEach((n) => {
          scores.set(n.id(), pr.rank(n));
        });
      } else if (selectedAlgo === 'betweenness') {
        const bc = eles.betweennessCentrality();
        nodes.forEach((n) => {
          scores.set(
            n.id(),
            bc.betweennessNormalized(n),
          );
        });
      } else if (selectedAlgo === 'closeness') {
        nodes.forEach((n) => {
          const cc = eles.closenessCentralityNormalized({
            root: n,
          });
          scores.set(n.id(), cc);
        });
      } else if (selectedAlgo === 'degree') {
        nodes.forEach((n) => {
          const dc = eles.degreeCentralityNormalized({
            root: n,
          });
          scores.set(n.id(), dc.degree);
        });
      }

      // Sort and get top 15
      const sorted = [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      const topResults = sorted.map(
        ([id, score], idx) => {
          const n = cytoscapeObject.getElementById(id);
          return {
            rank: idx + 1,
            id,
            label: n.data('label') || 'Unknown',
            name: String(getNodeName(n))
              .substring(0, 35),
            score: score.toFixed(4),
            bg: n.data('backgroundColor')
              || '#C990C0',
          };
        },
      );

      setResults({
        items: topResults,
        allScores: scores,
      });
      setComputing(false);
    }, 50);
  }, [cytoscapeObject, selectedAlgo]);

  const applyHeatMap = useCallback(() => {
    if (!cytoscapeObject || !results) return;
    const { allScores } = results;
    const vals = [...allScores.values()];
    const maxScore = Math.max(...vals, 0.001);

    // Save original styles
    origStyles.current.clear();
    cytoscapeObject.nodes().forEach((n) => {
      origStyles.current.set(n.id(), {
        size: n.data('size'),
        bg: n.data('backgroundColor'),
      });
    });

    // Apply heat map
    cytoscapeObject.nodes().forEach((n) => {
      const raw = allScores.get(n.id()) || 0;
      const norm = raw / maxScore;
      const newSize = Math.round(
        30 + norm * 90,
      );
      n.data('size', newSize);
      n.style(
        'background-color',
        scoreToColor(norm),
      );
    });
    setHeatMapActive(true);
  }, [cytoscapeObject, results]);

  const resetHeatMap = useCallback(() => {
    if (!cytoscapeObject) return;
    origStyles.current.forEach((style, id) => {
      const n = cytoscapeObject.getElementById(id);
      if (n.length > 0) {
        n.data('size', style.size);
        n.style('background-color', style.bg);
      }
    });
    origStyles.current.clear();
    setHeatMapActive(false);
  }, [cytoscapeObject]);

  const handleClose = useCallback(() => {
    if (heatMapActive) resetHeatMap();
    setResults(null);
    onClose();
  }, [heatMapActive, resetHeatMap, onClose]);

  if (!visible) return null;

  const nodeCount = cytoscapeObject
    ? cytoscapeObject.nodes().size()
    : 0;

  return (
    <div className="algorithms-panel">
      <div className="algo-header">
        <span className="algo-title">
          <FontAwesomeIcon
            icon={faBrain}
            style={{ marginRight: 8 }}
          />
          Graph Algorithms
        </span>
        <button
          type="button"
          className="node-detail-close"
          onClick={handleClose}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="algo-body">
        {nodeCount > 5000 && (
          <div className="algo-warning">
            Large graph (
            {nodeCount}
            {' nodes) — computation may'}
            {' take a moment.'}
          </div>
        )}

        <div className="algo-section">
          <div className="algo-section-title">
            Algorithm
          </div>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label>
            <select
              className="algo-select"
              value={selectedAlgo}
              onChange={(e) => {
                setSelectedAlgo(e.target.value);
                if (heatMapActive) resetHeatMap();
                setResults(null);
              }}
            >
              {ALGORITHMS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <div
            style={{
              fontSize: 11,
              color: '#999',
              marginTop: 4,
            }}
          >
            {ALGORITHMS.find(
              (a) => a.key === selectedAlgo,
            )?.desc}
          </div>
          <button
            type="button"
            className="algo-run-btn"
            onClick={runAlgorithm}
            disabled={computing || !cytoscapeObject}
          >
            {computing ? 'Computing...' : 'Run'}
          </button>
        </div>

        {computing && (
          <div className="algo-computing">
            Analyzing graph structure...
          </div>
        )}

        {results && (
          <>
            <div className="algo-section">
              <div className="algo-heatmap-toggle">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>
                  <input
                    type="checkbox"
                    checked={heatMapActive}
                    onChange={(e) => {
                      if (e.target.checked) {
                        applyHeatMap();
                      } else {
                        resetHeatMap();
                      }
                    }}
                  />
                  Apply Heat Map
                </label>
              </div>
              {heatMapActive && (
                <>
                  <div className="algo-legend">
                    <span>Low</span>
                    <div
                      className="algo-gradient-bar"
                    />
                    <span>High</span>
                  </div>
                  <button
                    type="button"
                    className="algo-reset-btn"
                    onClick={resetHeatMap}
                  >
                    Reset Styling
                  </button>
                </>
              )}
            </div>

            <div className="algo-section">
              <div className="algo-section-title">
                Top 15 Nodes
              </div>
              <div className="algo-results">
                {results.items.map((r) => (
                  <div
                    key={r.id}
                    className="algo-result-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!cytoscapeObject) return;
                      const n = cytoscapeObject
                        .getElementById(r.id);
                      if (n.length > 0) {
                        cytoscapeObject.animate({
                          center: { eles: n },
                          zoom: 2,
                          duration: 400,
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      if (!cytoscapeObject) return;
                      const n = cytoscapeObject
                        .getElementById(r.id);
                      if (n.length > 0) {
                        cytoscapeObject.animate({
                          center: { eles: n },
                          zoom: 2,
                          duration: 400,
                        });
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <span
                      className="algo-result-rank"
                    >
                      {r.rank}
                    </span>
                    <span
                      className="algo-result-badge"
                      style={{
                        backgroundColor: r.bg,
                      }}
                    >
                      {r.label}
                    </span>
                    <span
                      className="algo-result-name"
                    >
                      {r.name}
                    </span>
                    <span
                      className="algo-result-score"
                    >
                      {r.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

AlgorithmsPanel.defaultProps = {
  cytoscapeObject: null,
};

AlgorithmsPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
};

export default AlgorithmsPanel;
