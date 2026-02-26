import React, {
  useState, useCallback, useMemo, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import CytoscapeComponent from 'react-cytoscapejs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { setCommand } from '../../features/editor/EditorSlice';
import './SchemaViewer.css';

const SCHEMA_COLORS = [
  '#27ae60', '#2980b9', '#e67e22', '#8e44ad',
  '#e74c3c', '#1abc9c', '#f39c12', '#2c3e50',
  '#d35400', '#16a085', '#c0392b', '#7f8c8d',
];

const SchemaViewer = ({
  visible, onClose, cytoscapeObject, graph,
}) => {
  const dispatch = useDispatch();
  const [schemaCy, setSchemaCy] = useState(null);
  const [expandedLabel, setExpandedLabel] = useState(
    null,
  );

  const schema = useMemo(() => {
    if (!cytoscapeObject) {
      return { nodeTypes: {}, edgeTriples: {} };
    }
    const nodeTypes = {};
    const edgeTriples = {};

    cytoscapeObject.nodes().forEach((n) => {
      const label = n.data('label');
      if (!label) return;
      if (!nodeTypes[label]) {
        nodeTypes[label] = {
          count: 0, props: new Set(),
        };
      }
      nodeTypes[label].count += 1;
      const p = n.data('properties') || {};
      Object.keys(p).forEach((k) => {
        nodeTypes[label].props.add(k);
      });
    });

    cytoscapeObject.edges().forEach((e) => {
      const srcLabel = e.source().data('label');
      const edgeLabel = e.data('label');
      const tgtLabel = e.target().data('label');
      if (!srcLabel || !edgeLabel || !tgtLabel) return;
      const key = `${srcLabel}-${edgeLabel}-${tgtLabel}`;
      if (!edgeTriples[key]) {
        edgeTriples[key] = {
          src: srcLabel,
          edge: edgeLabel,
          tgt: tgtLabel,
          count: 0,
        };
      }
      edgeTriples[key].count += 1;
    });

    return { nodeTypes, edgeTriples };
  }, [cytoscapeObject, visible]);

  const colorMap = useMemo(() => {
    const map = {};
    const labels = Object.keys(schema.nodeTypes);
    // Try to get colors from main graph legend
    if (cytoscapeObject) {
      labels.forEach((label) => {
        const sample = cytoscapeObject.nodes(
          `[label = "${label}"]`,
        ).first();
        if (sample.length > 0) {
          const bg = sample.data('backgroundColor');
          if (bg) {
            map[label] = bg;
            return;
          }
        }
        // fallback
        const idx = labels.indexOf(label)
          % SCHEMA_COLORS.length;
        map[label] = SCHEMA_COLORS[idx];
      });
    }
    return map;
  }, [schema, cytoscapeObject]);

  const schemaElements = useMemo(() => {
    const nodes = Object.entries(
      schema.nodeTypes,
    ).map(([label, info]) => ({
      data: {
        id: `schema-${label}`,
        label,
        size: Math.max(
          25,
          Math.log(info.count + 1) * 15,
        ),
        backgroundColor: colorMap[label]
          || '#888',
      },
    }));

    const edges = Object.entries(
      schema.edgeTriples,
    ).map(([key, info]) => ({
      data: {
        id: `se-${key}`,
        source: `schema-${info.src}`,
        target: `schema-${info.tgt}`,
        label: info.edge,
        width: Math.max(
          1,
          Math.log(info.count + 1) * 1.5,
        ),
      },
    }));

    return CytoscapeComponent.normalizeElements({
      nodes,
      edges,
    });
  }, [schema, colorMap]);

  const schemaStylesheet = useMemo(() => [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        width: 'data(size)',
        height: 'data(size)',
        'background-color': 'data(backgroundColor)',
        'font-size': '9px',
        color: '#2A2C34',
        'text-valign': 'bottom',
        'text-margin-y': 4,
        'text-background-color': '#fff',
        'text-background-opacity': 0.85,
        'text-background-padding': '2px',
      },
    },
    {
      selector: 'edge',
      style: {
        width: 'data(width)',
        'line-color': '#aaa',
        'target-arrow-color': '#aaa',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        label: 'data(label)',
        'font-size': '7px',
        color: '#888',
        'text-background-color': '#fff',
        'text-background-opacity': 0.85,
        'text-background-padding': '1px',
        'text-rotation': 'autorotate',
      },
    },
  ], []);

  const cyCallback = useCallback((cy) => {
    if (schemaCy) return;
    setSchemaCy(cy);
  }, [schemaCy]);

  // Run layout when schema elements change
  useEffect(() => {
    if (!schemaCy || schemaElements.length === 0) {
      return;
    }
    schemaCy.elements().remove();
    schemaCy.add(schemaElements);
    schemaCy.minZoom(0.3);
    schemaCy.maxZoom(1.5);
    schemaCy.layout({
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 50,
      rankSep: 60,
      animate: true,
      fit: true,
      padding: 20,
    }).run();
    schemaCy.maxZoom(5);
  }, [schemaCy, schemaElements]);

  // Click handler for schema nodes/edges
  useEffect(() => {
    if (!schemaCy) return undefined;
    const handler = (evt) => {
      const ele = evt.target;
      if (!ele.isNode || (!ele.isNode()
        && !ele.isEdge())) return;

      let cypher;
      if (ele.isNode()) {
        const label = ele.data('label');
        cypher = `MATCH (n:${label}) RETURN n LIMIT 100`;
      } else {
        const src = ele.source().data('label');
        const edgeLabel = ele.data('label');
        const tgt = ele.target().data('label');
        cypher = `MATCH (a:${src})-[r:${edgeLabel}]->(b:${tgt}) RETURN a,r,b LIMIT 50`;
      }

      const cols = cypher.match(
        /RETURN\s+(.+?)(?:\s+LIMIT|\s*$)/i,
      );
      let colDefs = 'v agtype';
      if (cols && cols[1]) {
        const parts = cols[1].split(',');
        colDefs = parts
          .map((_, i) => `v${i} agtype`)
          .join(', ');
      }
      const sql = `SELECT * FROM cypher('${graph}', $$ ${cypher} $$) as (${colDefs});`;
      dispatch(setCommand(sql));
    };
    schemaCy.on('tap', 'node, edge', handler);
    return () => {
      schemaCy.off('tap', 'node, edge', handler);
    };
  }, [schemaCy, graph, dispatch]);

  // Reset schemaCy when modal closes
  useEffect(() => {
    if (!visible) {
      setSchemaCy(null);
    }
  }, [visible]);

  if (!visible) return null;

  const nodeLabels = Object.keys(schema.nodeTypes);

  /* eslint-disable
    jsx-a11y/click-events-have-key-events,
    jsx-a11y/no-static-element-interactions */
  return (
    <div
      className="schema-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="schema-card">
        <div className="schema-header">
          <span className="schema-title">
            Graph Schema
          </span>
          <button
            type="button"
            className="node-detail-close"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="schema-graph-area">
          <CytoscapeComponent
            elements={[]}
            stylesheet={schemaStylesheet}
            cy={cyCallback}
            style={{ width: '100%', height: '100%' }}
            wheelSensitivity={0.3}
          />
        </div>

        <div className="schema-props-area">
          {nodeLabels.length === 0 ? (
            <div className="schema-empty">
              No graph data loaded
            </div>
          ) : (
            nodeLabels.map((label) => {
              const info = schema.nodeTypes[label];
              const propsArr = Array.from(info.props);
              const isOpen = expandedLabel === label;
              return (
                <div
                  className="schema-label-row"
                  key={label}
                >
                  {/* eslint-disable */}
                  <div
                    className="schema-label-name"
                    onClick={() => setExpandedLabel(
                      isOpen ? null : label,
                    )}
                  >
                    {/* eslint-enable */}
                    <span
                      className="schema-label-dot"
                      style={{
                        background: colorMap[label]
                          || '#888',
                      }}
                    />
                    {label}
                    <span
                      className="schema-label-count"
                    >
                      (
                      {info.count}
                      )
                    </span>
                  </div>
                  {isOpen && propsArr.length > 0 && (
                    <div className="schema-props-list">
                      {propsArr.map((p) => (
                        <span
                          className="schema-prop-chip"
                          key={p}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

SchemaViewer.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
  graph: PropTypes.string.isRequired,
};

SchemaViewer.defaultProps = {
  cytoscapeObject: null,
};

export default SchemaViewer;
