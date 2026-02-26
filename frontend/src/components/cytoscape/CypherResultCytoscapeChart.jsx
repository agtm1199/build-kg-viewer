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
  useCallback, useEffect, useRef, useState,
} from 'react';
import ReactDOMServer from 'react-dom/server';
import PropTypes from 'prop-types';
import cytoscape from 'cytoscape';
import COSEBilkent from 'cytoscape-cose-bilkent';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';
import klay from 'cytoscape-klay';
import euler from 'cytoscape-euler';
import avsdf from 'cytoscape-avsdf';
import spread from 'cytoscape-spread';
import { useDispatch } from 'react-redux';
import CytoscapeComponent from 'react-cytoscapejs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEyeSlash,
  faLockOpen,
  faProjectDiagram,
  faTrash,
  faThumbtack,
  faCopy,
  faInfoCircle,
  faSitemap,
  faBullseye,
  faCodeBranch,
  faArrowLeft,
  faArrowRight,
  faTags,
} from '@fortawesome/free-solid-svg-icons';
import uuid from 'react-uuid';
import cxtmenu from '../../lib/cytoscape-cxtmenu';
import { initLocation, seletableLayouts } from './CytoscapeLayouts';
import { stylesheet } from './CytoscapeStyleSheet';
import { generateCytoscapeElement } from '../../features/cypher/CypherUtil';
import IconFilter from '../../icons/IconFilter';
import IconSearchCancel from '../../icons/IconSearchCancel';
import GraphTooltip from './GraphTooltip';
import './CytoscapeNavigator.css';
import styles from '../frame/Frame.module.scss';

cytoscape.use(COSEBilkent);
cytoscape.use(cola);
cytoscape.use(dagre);
cytoscape.use(klay);
cytoscape.use(euler);
cytoscape.use(avsdf);
cytoscape.use(spread);
cytoscape.use(cxtmenu);

const CypherResultCytoscapeCharts = ({
  elements,
  cytoscapeObject,
  setCytoscapeObject,
  cytoscapeLayout,
  maxDataOfGraph,
  onElementsMouseover,
  onNodeClick,
  addLegendData,
  graph,
  onAddSubmit,
  onRemoveSubmit,
  openModal,
  addGraphHistory,
  addElementHistory,
}) => {
  const [cytoscapeMenu, setCytoscapeMenu] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const navigatorRef = useRef(null);
  const navigatorInitRef = useRef(false);
  const onNodeClickRef = useRef(onNodeClick);
  const graphRef = useRef(graph);
  const addElementsRef = useRef(null);
  const dispatch = useDispatch();

  // Keep refs in sync with latest values
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  useEffect(() => {
    graphRef.current = graph;
  }, [graph]);
  const addEventOnElements = (targetElements) => {
    targetElements.bind('mouseover', (e) => {
      onElementsMouseover({ type: 'elements', data: e.target.data() });
      e.target.addClass('highlight');
      const pos = e.target.renderedPosition();
      setTooltipData({
        data: e.target.data(),
        x: pos.x,
        y: pos.y,
        connectedEdges: e.target.isNode() ? e.target.connectedEdges().size() : 0,
      });
    });

    targetElements.bind('mouseout', (e) => {
      if (cytoscapeObject.elements(':selected').length === 0) {
        onElementsMouseover({
          type: 'background',
          data: {
            nodeCount: cytoscapeObject.nodes().size(),
            edgeCount: cytoscapeObject.edges().size(),
          },
        });
      } else {
        onElementsMouseover({
          type: 'elements',
          data: cytoscapeObject.elements(':selected')[0].data(),
        });
      }

      e.target.removeClass('highlight');
      setTooltipData(null);
    });

    targetElements.bind('click', (e) => {
      const ele = e.target;
      if (ele.isNode() && onNodeClickRef.current) {
        onNodeClickRef.current({
          type: 'elements', data: ele.data(),
        });
      }
      if (ele.selected() && ele.isNode()) {
        if (cytoscapeObject.nodes(':selected').size() === 1) {
          ele.neighborhood().selectify().select().unselectify();
        } else {
          cytoscapeObject
            .nodes(':selected')
            .filter(`[id != "${ele.id()}"]`)
            .neighborhood()
            .selectify()
            .select()
            .unselectify();
        }
      } else {
        cytoscapeObject.elements(':selected').unselect().selectify();
      }
    });

    cytoscapeObject.bind('click', (e) => {
      if (e.target === cytoscapeObject) {
        cytoscapeObject.elements(':selected').unselect().selectify();
        if (onNodeClickRef.current) {
          onNodeClickRef.current(null);
        }
        onElementsMouseover({
          type: 'background',
          data: {
            nodeCount: cytoscapeObject.nodes().size(),
            edgeCount: cytoscapeObject.edges().size(),
          },
        });
      }
    });
  };

  const addElements = (centerId, d) => {
    const generatedData = generateCytoscapeElement(
      d.rows,
      maxDataOfGraph,
      true,
    );
    if (generatedData.elements.nodes.length === 0) {
      alert('No data to extend.');
      return;
    }

    cytoscapeObject.elements().lock();
    cytoscapeObject.add(generatedData.elements);

    const newlyAddedEdges = cytoscapeObject.edges('.new');
    const newlyAddedTargets = newlyAddedEdges.targets();
    const newlyAddedSources = newlyAddedEdges.sources();
    const rerenderTargets = newlyAddedEdges
      .union(newlyAddedTargets)
      .union(newlyAddedSources);

    const centerPosition = {
      ...cytoscapeObject.nodes().getElementById(centerId).position(),
    };
    cytoscapeObject.elements().unlock();
    rerenderTargets.layout(seletableLayouts.concentric).run();

    const centerMovedPosition = {
      ...cytoscapeObject.nodes().getElementById(centerId).position(),
    };
    const xGap = centerMovedPosition.x - centerPosition.x;
    const yGap = centerMovedPosition.y - centerPosition.y;
    rerenderTargets.forEach((ele) => {
      const pos = ele.position();
      ele.position({ x: pos.x - xGap, y: pos.y - yGap });
    });
    addEventOnElements(cytoscapeObject.elements('new'));

    addLegendData(generatedData.legend);
    rerenderTargets.removeClass('new');
  };

  addElementsRef.current = addElements;

  useEffect(() => {
    if (cytoscapeMenu === null && cytoscapeObject !== null) {
      const cxtMenuConf = {
        menuRadius(ele) {
          return ele.cy().zoom() <= 1 ? 55 : 70;
        },
        selector: 'node',
        commands: [
          {
            tooltip: 'Reset Position',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon icon={faLockOpen} size="lg" />,
            ),
            select(ele) {
              ele.animate({ position: initLocation[ele.id()] });
            },
          },
          {
            tooltip: 'Expand Neighbors',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon icon={faProjectDiagram} size="lg" />,
            ),
            select(ele) {
              const elAnimate = ele.animation({
                style: {
                  'border-color': 'green',
                  'border-width': '11px',
                },
                duration: 1000,
              });
              elAnimate.play();
              const animateTimer = setInterval(() => {
                if (elAnimate.complete()) {
                  elAnimate.reverse().play();
                }
              }, 1000);

              fetch('/api/v1/cypher', {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  cmd: `SELECT * FROM cypher('${graphRef.current}', $$ MATCH (S)-[R]->(T) WHERE id(S) = ${ele.id()} RETURN S, R, T $$) as (S agtype, R agtype, T agtype) UNION ALL SELECT * FROM cypher('${graphRef.current}', $$ MATCH (S)<-[R]-(T) WHERE id(S) = ${ele.id()} RETURN S, R, T $$) as (S agtype, R agtype, T agtype);`,
                }),
              })
                .then((res) => res.json())
                .then((data) => {
                  elAnimate.rewind().stop();
                  clearInterval(animateTimer);
                  addElementsRef.current(ele.id(), data);
                });
            },
          },
          {
            tooltip: 'Hide Node',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon icon={faEyeSlash} size="lg" />,
            ),
            select(ele) {
              ele.remove();
            },
          },
          {
            tooltip: 'Delete Node',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon icon={faTrash} size="lg" />,
            ),
            select(ele) {
              dispatch(openModal());
              dispatch(addGraphHistory(graphRef.current));
              dispatch(addElementHistory(ele.id()));
            },
          },
          {
            tooltip: 'Pin / Unpin',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon icon={faThumbtack} size="lg" />,
            ),
            select(ele) {
              if (!ele.locked()) {
                ele.lock();
              } else {
                ele.unlock();
              }
            },
          },
          {
            tooltip: 'Add Filter',
            content: ReactDOMServer.renderToString(<IconFilter size="lg" />),
            select(ele) {
              const newFilterObject = {
                key: uuid(),
                keyword: ele.data().properties[ele.data().caption],
                property: {
                  label: ele.data().label,
                  property: ele.data().caption,
                },
              };
              onAddSubmit(newFilterObject);
            },
          },
          {
            tooltip: 'Remove Filter',
            content: ReactDOMServer.renderToString(
              <IconSearchCancel size="lg" />,
            ),
            select(ele) {
              const keywordObject = {
                keyword: ele.data().properties[ele.data().caption],
              };
              onRemoveSubmit(keywordObject);
            },
          },
          {
            tooltip: 'Copy Properties',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon icon={faCopy} size="lg" />,
            ),
            select(ele) {
              const d = ele.data();
              const props = d.properties || {};
              const text = Object.entries(props)
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n');
              navigator.clipboard.writeText(text);
            },
          },
          {
            tooltip: 'Select Neighbors',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon
                icon={faSitemap}
                size="lg"
              />,
            ),
            select(ele) {
              ele.neighborhood().nodes()
                .selectify().select()
                .unselectify();
            },
          },
          {
            tooltip: 'Isolate / Restore',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon
                icon={faBullseye}
                size="lg"
              />,
            ),
            select(ele) {
              const cy = ele.cy();
              const cls = 'g-isolated';
              if (cy.elements(`.${cls}`).length > 0) {
                cy.elements(`.${cls}`)
                  .style('opacity', '1')
                  .removeClass(cls);
                return;
              }
              const hood = ele
                .closedNeighborhood();
              cy.elements()
                .difference(hood)
                .addClass(cls)
                .style('opacity', '0.08');
            },
          },
          {
            tooltip: 'Expand Paths (1-2 hops)',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon
                icon={faCodeBranch}
                size="lg"
              />,
            ),
            select(ele) {
              const elAnimate = ele.animation({
                style: {
                  'border-color': '#e74c3c',
                  'border-width': '11px',
                },
                duration: 1000,
              });
              elAnimate.play();
              const timer = setInterval(() => {
                if (elAnimate.complete()) {
                  elAnimate.reverse().play();
                }
              }, 1000);

              fetch('/api/v1/cypher', {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  cmd: `SELECT * FROM cypher('${graphRef.current}', $$ MATCH (S)-[R*1..2]-(T) WHERE id(S) = ${ele.id()} RETURN S, relationships(R) as R2, T $$) as (S agtype, R2 agtype, T agtype);`,
                }),
              })
                .then((res) => res.json())
                .then((data) => {
                  elAnimate.rewind().stop();
                  clearInterval(timer);
                  addElementsRef.current(ele.id(), data);
                })
                .catch(() => {
                  elAnimate.rewind().stop();
                  clearInterval(timer);
                });
            },
          },
          {
            tooltip: 'Node Details',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon
                icon={faInfoCircle}
                size="lg"
              />,
            ),
            select(ele) {
              if (onNodeClickRef.current) {
                onNodeClickRef.current({
                  type: 'elements',
                  data: ele.data(),
                });
              }
            },
          },
        ],
        fillColor: 'rgba(210, 213, 218, 1)',
        activeFillColor: 'rgba(166, 166, 166, 1)',
        activePadding: 0,
        indicatorSize: 0,
        separatorWidth: 4,
        spotlightPadding: 3,
        minSpotlightRadius: 11,
        maxSpotlightRadius: 99,
        openMenuEvents: 'cxttap',
        itemColor: '#2A2C34',
        itemTextShadowColor: 'transparent',
        zIndex: 9999,
        atMouse: false,
      };
      setCytoscapeMenu(cytoscapeObject.cxtmenu(cxtMenuConf));

      // Edge context menu
      const edgeCxtMenuConf = {
        menuRadius(ele) {
          return ele.cy().zoom() <= 1 ? 50 : 60;
        },
        selector: 'edge',
        commands: [
          {
            tooltip: 'Go to Source',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon
                icon={faArrowLeft}
                size="lg"
              />,
            ),
            select(ele) {
              const src = ele.source();
              src.selectify().select()
                .unselectify();
              ele.cy().animate({
                center: { eles: src },
                duration: 300,
              });
              if (onNodeClickRef.current) {
                onNodeClickRef.current({
                  type: 'elements',
                  data: src.data(),
                });
              }
            },
          },
          {
            tooltip: 'Go to Target',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon
                icon={faArrowRight}
                size="lg"
              />,
            ),
            select(ele) {
              const tgt = ele.target();
              tgt.selectify().select()
                .unselectify();
              ele.cy().animate({
                center: { eles: tgt },
                duration: 300,
              });
              if (onNodeClickRef.current) {
                onNodeClickRef.current({
                  type: 'elements',
                  data: tgt.data(),
                });
              }
            },
          },
          {
            tooltip: 'Select Same Type',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon
                icon={faTags}
                size="lg"
              />,
            ),
            select(ele) {
              const lbl = ele.data('label');
              ele.cy()
                .edges(`[label = "${lbl}"]`)
                .selectify().select()
                .unselectify();
            },
          },
          {
            tooltip: 'Copy Properties',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon
                icon={faCopy}
                size="lg"
              />,
            ),
            select(ele) {
              const d = ele.data();
              const props = d.properties || {};
              const lines = [
                `[${d.label}]`,
                ...Object.entries(props)
                  .map(([k, v]) => `${k}: ${v}`),
              ];
              navigator.clipboard.writeText(
                lines.join('\n'),
              );
            },
          },
          {
            tooltip: 'Hide Edge',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon
                icon={faEyeSlash}
                size="lg"
              />,
            ),
            select(ele) {
              ele.remove();
            },
          },
          {
            tooltip: 'Edge Details',
            content: ReactDOMServer.renderToString(
              <FontAwesomeIcon
                icon={faInfoCircle}
                size="lg"
              />,
            ),
            select(ele) {
              if (onNodeClickRef.current) {
                onNodeClickRef.current({
                  type: 'elements',
                  data: ele.data(),
                });
              }
            },
          },
        ],
        fillColor: 'rgba(210, 213, 218, 1)',
        activeFillColor: 'rgba(166, 166, 166, 1)',
        activePadding: 0,
        indicatorSize: 0,
        separatorWidth: 4,
        spotlightPadding: 3,
        minSpotlightRadius: 11,
        maxSpotlightRadius: 99,
        openMenuEvents: 'cxttap',
        itemColor: '#2A2C34',
        itemTextShadowColor: 'transparent',
        zIndex: 9999,
        atMouse: false,
      };
      cytoscapeObject.cxtmenu(edgeCxtMenuConf);
    }
  }, [cytoscapeObject, cytoscapeMenu]);

  useEffect(() => {
    if (cytoscapeLayout && cytoscapeObject) {
      const selectedLayout = seletableLayouts[cytoscapeLayout];
      selectedLayout.animate = true;
      selectedLayout.fit = true;

      cytoscapeObject.minZoom(1e-1);
      cytoscapeObject.maxZoom(1.5);
      cytoscapeObject.layout(selectedLayout).run();
      cytoscapeObject.maxZoom(5);
      if (!initialized) {
        addEventOnElements(cytoscapeObject.elements());
        cytoscapeObject.on('viewport', () => setTooltipData(null));
        setInitialized(true);
      }
    }
  }, [cytoscapeObject, cytoscapeLayout]);

  // Minimap: render a PNG thumbnail of the graph
  useEffect(() => {
    if (!cytoscapeObject || !navigatorRef.current || navigatorInitRef.current) return;
    navigatorInitRef.current = true;
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 140;
    navigatorRef.current.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let minimapTimer = null;
    const drawMinimap = () => {
      if (!cytoscapeObject || cytoscapeObject.destroyed()) return;
      try {
        const pngUri = cytoscapeObject.png({
          output: 'base64uri', bg: '#fafafa', full: true,
        });
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, 180, 140);
          const scale = Math.min(
            180 / img.width, 140 / img.height,
          );
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(
            img, (180 - w) / 2, (140 - h) / 2, w, h,
          );
        };
        img.src = pngUri;
      } catch (err) {
        // ignore render errors
      }
    };
    const debouncedDraw = () => {
      if (minimapTimer) clearTimeout(minimapTimer);
      minimapTimer = setTimeout(drawMinimap, 300);
    };

    drawMinimap();
    cytoscapeObject.on('viewport layoutstop add remove', debouncedDraw);
  }, [cytoscapeObject]);

  const cyCallback = useCallback(
    (newCytoscapeObject) => {
      if (cytoscapeObject) return;
      setCytoscapeObject(newCytoscapeObject);
    },
    [cytoscapeObject],
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <CytoscapeComponent
        elements={CytoscapeComponent.normalizeElements(elements)}
        stylesheet={stylesheet}
        cy={cyCallback}
        className={styles.NormalChart}
        wheelSensitivity={0.3}
      />
      <GraphTooltip tooltipData={tooltipData} />
      <div ref={navigatorRef} className="cytoscape-navigator-container" />
    </div>
  );
};

CypherResultCytoscapeCharts.defaultProps = {
  cytoscapeObject: null,
  onNodeClick: null,
};

CypherResultCytoscapeCharts.propTypes = {
  elements: PropTypes.shape({
    nodes: PropTypes.arrayOf(
      PropTypes.shape({
        // eslint-disable-next-line react/forbid-prop-types
        data: PropTypes.any,
      }),
    ),
    edges: PropTypes.arrayOf(
      PropTypes.shape({
        // eslint-disable-next-line react/forbid-prop-types
        data: PropTypes.any,
      }),
    ),
  }).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  cytoscapeObject: PropTypes.any,
  setCytoscapeObject: PropTypes.func.isRequired,
  cytoscapeLayout: PropTypes.string.isRequired,
  maxDataOfGraph: PropTypes.number.isRequired,
  onElementsMouseover: PropTypes.func.isRequired,
  onNodeClick: PropTypes.func,
  addLegendData: PropTypes.func.isRequired,
  graph: PropTypes.string.isRequired,
  onAddSubmit: PropTypes.func.isRequired,
  onRemoveSubmit: PropTypes.func.isRequired,
  openModal: PropTypes.func.isRequired,
  addGraphHistory: PropTypes.func.isRequired,
  addElementHistory: PropTypes.func.isRequired,
};

export default CypherResultCytoscapeCharts;
