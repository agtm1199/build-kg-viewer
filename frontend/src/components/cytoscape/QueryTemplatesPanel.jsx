import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { setCommand } from '../../features/editor/EditorSlice';
import './QueryTemplatesPanel.css';

const TEMPLATES = [
  {
    category: 'Explore',
    templates: [
      {
        name: 'All nodes by label',
        query: 'MATCH (n:{label}) RETURN n LIMIT {limit}',
        params: [
          { key: 'label', source: 'nodeLabels' },
          { key: 'limit', default: '100' },
        ],
      },
      {
        name: 'Connected neighbors',
        query: 'MATCH (n:{label})-[r]-(m) RETURN n,r,m LIMIT {limit}',
        params: [
          { key: 'label', source: 'nodeLabels' },
          { key: 'limit', default: '50' },
        ],
      },
      {
        name: 'Paths between types',
        query: 'MATCH p=(a:{src})-[*1..{depth}]-(b:{tgt}) RETURN p LIMIT {limit}',
        params: [
          { key: 'src', source: 'nodeLabels' },
          { key: 'tgt', source: 'nodeLabels' },
          { key: 'depth', default: '3' },
          { key: 'limit', default: '25' },
        ],
      },
    ],
  },
  {
    category: 'Aggregate',
    templates: [
      {
        name: 'Most connected nodes',
        query: 'MATCH (n:{label})-[r]-() RETURN n.name, count(r) as degree ORDER BY degree DESC LIMIT {limit}',
        params: [
          { key: 'label', source: 'nodeLabels' },
          { key: 'limit', default: '20' },
        ],
      },
      {
        name: 'Edge count by type',
        query: 'MATCH ()-[r:{edgeLabel}]->() RETURN count(r)',
        params: [
          { key: 'edgeLabel', source: 'edgeLabels' },
        ],
      },
    ],
  },
  {
    category: 'Regulatory',
    templates: [
      {
        name: 'Provisions by authority',
        query: "MATCH (p:Provision) WHERE p.authority = '{auth}' RETURN p LIMIT {limit}",
        params: [
          { key: 'auth', default: 'CFIA' },
          { key: 'limit', default: '100' },
        ],
      },
      {
        name: 'Requirements for provision',
        query: "MATCH (p:Provision)-[r]->(req:Requirement) WHERE p.provision_id = '{id}' RETURN p,r,req",
        params: [
          { key: 'id', default: '' },
        ],
      },
    ],
  },
];

const QueryTemplatesPanel = ({
  visible,
  onClose,
  graph,
  onExecute,
}) => {
  const dispatch = useDispatch();
  const [expandedIdx, setExpandedIdx] = useState(
    null,
  );
  const [paramValues, setParamValues] = useState(
    {},
  );

  const metadata = useSelector(
    (state) => state.metadata.graphs[
      state.metadata.currentGraph
    ] || {},
  );

  const nodeLabels = (metadata.nodes || [])
    .map((n) => n.label)
    .filter((l) => l !== '*');
  const edgeLabels = (metadata.edges || [])
    .map((e) => e.label)
    .filter((l) => l !== '*');

  const getSource = (src) => {
    if (src === 'nodeLabels') return nodeLabels;
    if (src === 'edgeLabels') return edgeLabels;
    return [];
  };

  const getKey = (catIdx, tplIdx) => (
    `${catIdx}-${tplIdx}`
  );

  const toggle = (catIdx, tplIdx) => {
    const key = getKey(catIdx, tplIdx);
    if (expandedIdx === key) {
      setExpandedIdx(null);
    } else {
      setExpandedIdx(key);
      // Init defaults
      const tpl = TEMPLATES[catIdx]
        .templates[tplIdx];
      const defaults = {};
      (tpl.params || []).forEach((p) => {
        if (p.source) {
          const opts = getSource(p.source);
          defaults[p.key] = opts[0] || '';
        } else {
          defaults[p.key] = p.default || '';
        }
      });
      setParamValues(defaults);
    }
  };

  const fillQuery = useCallback((tpl) => {
    let { query } = tpl;
    (tpl.params || []).forEach((p) => {
      const val = paramValues[p.key] || '';
      query = query.replace(
        new RegExp(`\\{${p.key}\\}`, 'g'),
        val,
      );
    });
    return query;
  }, [paramValues]);

  const wrapInAGE = (cypher) => {
    const cols = cypher.match(/RETURN\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s*$)/i);
    let colDefs = 'v agtype';
    if (cols && cols[1]) {
      const parts = cols[1].split(',');
      colDefs = parts
        .map((_, i) => `v${i} agtype`)
        .join(', ');
    }
    return `SELECT * FROM cypher('${graph}', $$ ${cypher} $$) as (${colDefs});`;
  };

  const handleUse = (tpl) => {
    const cypher = fillQuery(tpl);
    dispatch(setCommand(wrapInAGE(cypher)));
  };

  const handleRun = (tpl) => {
    const cypher = fillQuery(tpl);
    const cmd = wrapInAGE(cypher);
    dispatch(setCommand(cmd));
    if (onExecute) onExecute();
  };

  if (!visible) return null;

  return (
    <div className="templates-panel">
      <div className="tpl-header">
        <span className="tpl-title">
          Query Templates
        </span>
        <button
          type="button"
          className="node-detail-close"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="tpl-body">
        {TEMPLATES.map((cat, catIdx) => (
          <div
            className="tpl-category"
            key={cat.category}
          >
            <div className="tpl-category-title">
              {cat.category}
            </div>
            {cat.templates.map((tpl, tplIdx) => {
              const key = getKey(catIdx, tplIdx);
              const isExpanded = (
                expandedIdx === key
              );
              return (
                <div
                  className={
                    `tpl-card${
                      isExpanded ? ' expanded' : ''}`
                  }
                  key={tpl.name}
                >
                  {/* eslint-disable */}
                  <div
                    onClick={
                      () => toggle(catIdx, tplIdx)
                    }
                  >
                    {/* eslint-enable */}
                    <div className="tpl-card-name">
                      {tpl.name}
                    </div>
                    <div className="tpl-card-query">
                      {tpl.query}
                    </div>
                  </div>
                  {isExpanded && tpl.params && (
                    <div className="tpl-params">
                      {tpl.params.map((p) => (
                        <div
                          className="tpl-param-row"
                          key={p.key}
                        >
                          <span
                            className="tpl-param-label"
                          >
                            {p.key}
                          </span>
                          {p.source ? (
                            <select
                              className="tpl-param-select"
                              value={
                                paramValues[p.key]
                                || ''
                              }
                              onChange={(e) => {
                                setParamValues(
                                  (prev) => ({
                                    ...prev,
                                    [p.key]:
                                      e.target.value,
                                  }),
                                );
                              }}
                            >
                              {getSource(
                                p.source,
                              ).map((opt) => (
                                <option
                                  key={opt}
                                  value={opt}
                                >
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="tpl-param-input"
                              value={
                                paramValues[p.key]
                                || ''
                              }
                              onChange={(e) => {
                                setParamValues(
                                  (prev) => ({
                                    ...prev,
                                    [p.key]:
                                      e.target.value,
                                  }),
                                );
                              }}
                            />
                          )}
                        </div>
                      ))}
                      <div className="tpl-actions">
                        <button
                          type="button"
                          className="tpl-use-btn"
                          onClick={
                            () => handleUse(tpl)
                          }
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          className="tpl-run-btn"
                          onClick={
                            () => handleRun(tpl)
                          }
                        >
                          Run
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

QueryTemplatesPanel.defaultProps = {
  onExecute: null,
};

QueryTemplatesPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  graph: PropTypes.string.isRequired,
  onExecute: PropTypes.func,
};

export default QueryTemplatesPanel;
