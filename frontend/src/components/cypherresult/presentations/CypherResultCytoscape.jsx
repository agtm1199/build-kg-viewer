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
  forwardRef, useCallback, useEffect,
  useImperativeHandle, useState,
} from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faPalette,
  faChartBar,
  faRoute,
  faSlidersH,
  faObjectGroup,
  faBrain,
  faUndo,
  faRedo,
  faCamera,
  faFileCode,
  faProjectDiagram,
} from '@fortawesome/free-solid-svg-icons';
import {
  edgeLabelColors,
  edgeLabelSizes,
  nodeLabelColors,
  nodeLabelSizes,
} from '../../../features/cypher/CypherUtil';
import { setCommand } from '../../../features/editor/EditorSlice';
import CypherResultCytoscapeChart from '../../cytoscape/CypherResultCytoscapeChart';
import CypherResultCytoscapeLegend from '../../cytoscape/CypherResultCytoscapeLegend';
import CypherResultCytoscapeFooter from '../../cytoscape/CypherResultCytoscapeFooter';
import CypherResultTab from '../../cytoscape/CypherResultTab';
import GraphSearchBar from '../../cytoscape/GraphSearchBar';
import NodeDetailPanel from '../../cytoscape/NodeDetailPanel';
import StatisticsPanel from '../../cytoscape/StatisticsPanel';
import FacetedFilterSidebar from '../../cytoscape/FacetedFilterSidebar';
import NodeStylingPanel from '../../cytoscape/NodeStylingPanel';
import PathFinderPanel from '../../cytoscape/PathFinderPanel';
import RangeFilterPanel from '../../cytoscape/RangeFilterPanel';
import BreadcrumbNav from '../../cytoscape/BreadcrumbNav';
import NodeGrouping from '../../cytoscape/NodeGrouping';
import AlgorithmsPanel from '../../cytoscape/AlgorithmsPanel';
import useGraphUndoRedo from '../../cytoscape/GraphUndoRedo';
import SnapshotManager from '../../cytoscape/SnapshotManager';
import BatchOperationsBar from '../../cytoscape/BatchOperationsBar';
import QueryTemplatesPanel from '../../cytoscape/QueryTemplatesPanel';
import SchemaViewer from '../../cytoscape/SchemaViewer';
import '../../cytoscape/GraphDesignTokens.css';
import '../../cytoscape/GraphAnimations.css';
import '../../cytoscape/NodeGrouping.css';
import '../../cytoscape/DarkMode.css';
import {
  useKeyboardShortcuts,
  ShortcutsHelpOverlay,
} from '../../cytoscape/KeyboardShortcuts';

const CypherResultCytoscape = forwardRef((props, ref) => {
  const [footerData, setFooterData] = useState({});
  const [legendData, setLegendData] = useState({ edgeLegend: {}, nodeLegend: {} });
  const [elements, setElements] = useState({ edges: [], nodes: [] });
  const [isReloading, setIsReloading] = useState(false);
  const [maxDataOfGraph] = useState(props.maxDataOfGraph);
  const dispatch = useDispatch();
  const [selectedCaption, setSelectedCaption] = useState(null);
  const [captions, setCaptions] = useState([]);

  const [cytoscapeObject, setCytoscapeObject] = useState(null);
  const [cytoscapeLayout, setCytoscapeLayout] = useState('coseBilkent');
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStyling, setShowStyling] = useState(false);
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [pathPickMode, setPathPickMode] = useState(null);
  const [pathSource, setPathSource] = useState(null);
  const [pathTarget, setPathTarget] = useState(null);
  const [showRangeFilter, setShowRangeFilter] = useState(false);
  const [showAlgorithms, setShowAlgorithms] = useState(false);
  const [groupingEnabled, setGroupingEnabled] = useState(false);
  const [groupCount, setGroupCount] = useState(0);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [breadcrumbTrail, setBreadcrumbTrail] = useState([
    { label: 'Graph', type: 'home', key: 'home' },
  ]);

  // Track multi-select count + enable box select
  useEffect(() => {
    if (!cytoscapeObject) return undefined;
    cytoscapeObject.boxSelectionEnabled(true);
    const handler = () => {
      setSelectedCount(
        cytoscapeObject.elements(':selected').size(),
      );
    };
    cytoscapeObject.on('select unselect', handler);
    return () => {
      cytoscapeObject.off(
        'select unselect', handler,
      );
    };
  }, [cytoscapeObject]);

  const {
    captureSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useGraphUndoRedo(cytoscapeObject);

  const handleLayoutChange = useCallback(
    (next) => {
      captureSnapshot();
      setCytoscapeLayout(next);
    },
    [captureSnapshot, setCytoscapeLayout],
  );

  const onFocusSearch = useCallback(() => {
    const el = document.getElementById('graph-search-input');
    if (el) el.focus();
  }, []);

  useKeyboardShortcuts({
    cytoscapeObject,
    cytoscapeLayout,
    setCytoscapeLayout: handleLayoutChange,
    onFocusSearch,
    onShowHelp: () => setShowShortcutsHelp(true),
    onUndo: undo,
    onRedo: redo,
    onBeforeRemove: captureSnapshot,
  });

  // Dark mode: update cytoscape edge text-bg when theme changes
  useEffect(() => {
    const darkRadio = document.getElementById('dark-theme');
    const defaultRadio = document.getElementById(
      'default-theme',
    );
    if (!darkRadio || !defaultRadio) return undefined;

    const applyTheme = () => {
      if (!cytoscapeObject) return;
      const isDark = darkRadio.checked;
      const bgColor = isDark ? '#1e1e1e' : '#FFF';
      cytoscapeObject.edges().style(
        'text-background-color', bgColor,
      );
    };

    applyTheme();
    darkRadio.addEventListener('change', applyTheme);
    defaultRadio.addEventListener('change', applyTheme);
    return () => {
      darkRadio.removeEventListener(
        'change', applyTheme,
      );
      defaultRadio.removeEventListener(
        'change', applyTheme,
      );
    };
  }, [cytoscapeObject]);

  const handleNodeClick = useCallback((event) => {
    if (
      event
      && event.type === 'elements'
      && !event.data.source
    ) {
      // Path picker mode
      if (showPathFinder && pathPickMode) {
        if (pathPickMode === 'source') {
          setPathSource(event.data);
          setPathPickMode(
            pathTarget ? null : 'target',
          );
        } else if (pathPickMode === 'target') {
          setPathTarget(event.data);
          setPathPickMode(null);
        }
        return;
      }
      setSelectedNodeData(event.data);
      if (props.onSelectElement) {
        props.onSelectElement(
          String(event.data.id),
        );
      }
      // Update breadcrumb
      const nd = event.data;
      const name = (nd.properties || {}).name
        || (nd.properties || {}).provision_id
        || nd.label;
      setBreadcrumbTrail((prev) => [
        ...prev.slice(0, 1),
        {
          label: String(name).substring(0, 25),
          type: 'node',
          elementId: String(nd.id),
          key: String(nd.id),
        },
      ]);
    } else {
      setSelectedNodeData(null);
      if (props.onSelectElement) {
        props.onSelectElement(null);
      }
      setBreadcrumbTrail((prev) => prev.slice(0, 1));
    }
  }, [
    props.onSelectElement,
    showPathFinder,
    pathPickMode,
    pathTarget,
  ]);

  const handleCopyToEditor = useCallback((cmd) => {
    dispatch(setCommand(cmd));
  }, [dispatch]);

  // Sync: when selectedElementId changes from table
  useEffect(() => {
    if (
      !cytoscapeObject
      || !props.selectedElementId
    ) return;
    const node = cytoscapeObject.getElementById(
      props.selectedElementId,
    );
    if (node && node.length > 0 && node.isNode()) {
      cytoscapeObject.elements(':selected')
        .unselect()
        .selectify();
      node.selectify().select().unselectify();
      cytoscapeObject.animate({
        center: { eles: node },
        duration: 300,
      });
      setSelectedNodeData(node.data());
    }
  }, [props.selectedElementId, cytoscapeObject]);

  useEffect(() => {
    if (props.data.legend !== undefined && Object.keys(props.data.legend.nodeLegend).length > 0) {
      if (Object.keys(legendData.edgeLegend).length === 0
          && Object.keys(legendData.nodeLegend).length === 0) {
        setIsReloading(false);
      }

      setLegendData(props.data.legend);
      setElements(props.data.elements);
    }
  }, [props.data]);

  useEffect(() => {
    props.setChartLegend(props.data.legend);
  }, []);

  const getCaptionsFromCytoscapeObject = (elementType, label) => {
    const elementsObject = cytoscapeObject.elements(`${elementType}[label = "${label}"]`).jsons();
    const result = new Set();
    elementsObject.forEach((ele) => {
      Object.keys(ele.data.properties).forEach((k) => result.add(k));
    });
    return result;
  };

  const getFooterData = (event) => {
    if (event.type === 'labels') {
      setCaptions(['gid', 'label'].concat(Array.from(getCaptionsFromCytoscapeObject(event.data.type, event.data.label))));

      if (event.data.type === 'node') {
        setSelectedCaption(legendData.nodeLegend[event.data.label].caption);
      } else {
        setSelectedCaption(legendData.edgeLegend[event.data.label].caption);
      }
    }

    setFooterData(event);
  };

  const addLegendData = (addedLegendData) => {
    setIsReloading(false);
    setLegendData(addedLegendData);
    props.setChartLegend(addedLegendData);
  };
  const truncateLabel = (label) => {
    const maxLenEnglish = 8;
    const maxLenKorean = 6;
    const koreanCharRegex = /[\u3131-\uD79D]/ugi;
    const maxLength = koreanCharRegex.test(label) ? maxLenKorean : maxLenEnglish;
    return label.length > maxLength ? `${label.substring(0, maxLength)}...` : label;
  };
  const changeColorOnCytoscapeElements = (elementType, originalLabel, color) => {
    const label = truncateLabel(originalLabel);
    const colorObject = Array.isArray(color) ? {
      color: color[0],
      borderColor: color[1],
      fontColor: color[2],
    } : color;

    if (elementType === 'node') {
      cytoscapeObject.nodes(`[label = "${label}"]`).data('backgroundColor', colorObject.color)
        .data('borderColor', colorObject.borderColor).data('fontColor', colorObject.fontColor);
    } else if (elementType === 'edge') {
      cytoscapeObject.edges(`[label = "${label}"]`).data('backgroundColor', colorObject.color)
        .data('fontColor', colorObject.fontColor).data('fontColor', '#2A2C34');
    }
  };

  const colorChange = (elementType, label, color) => {
    const footerObj = {
      ...footerData.data,
      backgroundColor: color.color,
      fontColor: color.fontColor,
    };
    setIsReloading(false);
    setFooterData({ ...footerData, data: footerObj });

    if (elementType === 'node') {
      const nodeLegendObj = { ...legendData.nodeLegend };

      if (Object.prototype.hasOwnProperty.call(nodeLegendObj, label)) {
        nodeLegendObj[label] = {
          ...nodeLegendObj[label],
          color: color.color,
          borderColor: color.borderColor,
          fontColor: color.fontColor,
        };
      }

      setLegendData({ ...legendData, nodeLegend: nodeLegendObj });
      changeColorOnCytoscapeElements(elementType, label, color);
    } else if (elementType === 'edge') {
      const edgeLegendObj = { ...legendData.edgeLegend };
      if (Object.prototype.hasOwnProperty.call(edgeLegendObj, label)) {
        edgeLegendObj[label] = {
          ...edgeLegendObj[label],
          color: color.color,
          borderColor: color.borderColor,
          fontColor: color.fontColor,
        };
      }
      setLegendData({ ...legendData, edgeLegend: edgeLegendObj });
      changeColorOnCytoscapeElements(elementType, label, color);
    }

    dispatch(() => props.setLabels(elementType, label, {
      borderColor: color.borderColor,
      color: color.color,
      fontColor: color.fontColor,
    }));
  };

  const changeSizeOnCytoscapeElements = (elementType, label, size) => {
    const changedData = cytoscapeObject.elements(`${elementType}[label = "${label}"]`).data('size', size);

    if (size > 6) {
      changedData.style('text-background-opacity', 0);
    } else {
      changedData.style('text-background-opacity', 1);
    }
  };

  const sizeChange = (elementType, label, size) => {
    const footerObj = { ...footerData.data, size };
    setFooterData({ ...footerData, data: footerObj });
    setIsReloading(false);
    changeSizeOnCytoscapeElements(elementType, label, size);

    if (elementType === 'node') {
      const nodeLegendObj = { ...legendData.nodeLegend };
      if (Object.prototype.hasOwnProperty.call(nodeLegendObj, label)) {
        nodeLegendObj[label] = { ...nodeLegendObj[label], size };
      }
      setLegendData({ ...legendData, nodeLegend: nodeLegendObj });
    } else if (elementType === 'edge') {
      const edgeLegendObj = { ...legendData.edgeLegend };
      if (Object.prototype.hasOwnProperty.call(edgeLegendObj, label)) {
        edgeLegendObj[label] = { ...edgeLegendObj[label], size };
      }
      setLegendData({ ...legendData, edgeLegend: edgeLegendObj });
    }
    dispatch(() => props.setLabels(elementType, label, { size }));
  };

  const changeCaptionOnCytoscapeElements = (elementType, label, caption) => {
    if (caption === null) {
      cytoscapeObject.elements(`${elementType}[label = "${label}"]`).style('label', '');
    } else {
      cytoscapeObject.elements(`${elementType}[label = "${label}"]`).style('label', (ele) => {
        let displayValue = '< NULL >';
        if (caption === 'gid') {
          const idValue = ele.data('id');
          if (idValue !== null && idValue !== undefined) {
            displayValue = `[ ${idValue} ]`;
          }
        } else if (caption === 'label') {
          const labelValue = ele.data('label');
          if (labelValue !== null && labelValue !== undefined) {
            displayValue = `[ :${labelValue} ]`;
          }
        } else if (ele !== null && ele !== undefined) {
          const anonValue = ele.data('properties')[caption];
          if (anonValue !== null && anonValue !== undefined) {
            displayValue = anonValue;
          }
        }
        return displayValue;
      });
    }
  };

  const applyEdgeThicknessCytoscapeElements = (thickness) => {
    if (!cytoscapeObject) return;
    const edgeSizes = [1, 6, 11, 16, 21];
    if (thickness !== null) {
      const range = thickness.max - thickness.min;
      const edgeSizeByRate = (rate) => {
        if (rate >= 80) return edgeSizes[4];
        if (rate >= 60) return edgeSizes[3];
        if (rate >= 40) return edgeSizes[2];
        if (rate >= 20) return edgeSizes[1];
        return edgeSizes[0];
      };
      cytoscapeObject.edges().forEach((ele) => {
        if (ele.data('label') === thickness.edge
          && ele.data('properties')[thickness.property]) {
          const tempValue = ele.data('properties')[thickness.property];
          const propertyValue = (Number.isNaN(Number(tempValue)))
            ? Number(String(tempValue).replace(',', ''))
            : Number(tempValue);
          const propertyRate = ((propertyValue - thickness.min) / range) * 100;
          ele.style('width', edgeSizeByRate(propertyRate).toString());
        }
      });
    } else {
      cytoscapeObject.edges().style('width', '');
    }
  };

  const applyFilterOnCytoscapeElements = (filters) => {
    const gFilteredClassName = 'g-filtered';
    cytoscapeObject.elements(`.${gFilteredClassName}`).style('opacity', '1.0').removeClass(gFilteredClassName);

    let notFilteredNodeLength = 0;
    const notFilteredNodes = [];
    const filterLength = filters.length;
    let nullFilterCount = 0;
    for (let i = 0; i < filterLength; i += 1) {
      const { keyword } = filters[i];
      if (keyword === null || keyword === '') {
        nullFilterCount += 1;
      }
    }
    if (nullFilterCount === 1 && filterLength === 1) {
      // if null filter size is 1 and filter length is 1 -> not filtering.
      return;
    }
    cytoscapeObject.nodes().filter((ele) => {
      let notIncluded = true;
      const currentLabel = ele.data('label');
      for (let i = 0; i < filterLength; i += 1) {
        const { keyword } = filters[i];
        const { label, property } = filters[i].property;

        if (currentLabel === label) {
          const propertyValue = ele.data('properties')[property];
          if (keyword === null || keyword === '') {
            notIncluded = false;
          } else if (propertyValue === undefined || propertyValue === null) {
            notIncluded = true;
          } else if (propertyValue.toString().includes(keyword)) {
            notIncluded = false;
          }
        }
        if (!notIncluded) {
          break;
        }
      }
      if (notIncluded) {
        notFilteredNodeLength += 1;
        notFilteredNodes.push(ele);
      }
      return notIncluded;
    }).addClass(gFilteredClassName);

    // Step2. Edge Highlight from not filtered nodes.
    const targetAndSourceNodeList = [];
    for (let nodeIndex = 0; nodeIndex < notFilteredNodeLength; nodeIndex += 1) {
      const currentNode = notFilteredNodes[nodeIndex];
      const edges = currentNode.connectedEdges();
      const edgesSize = edges.length;
      for (let edgeIndex = 0; edgeIndex < edgesSize; edgeIndex += 1) {
        const currentEdge = edges[edgeIndex];
        const edgeTargetNode = currentEdge.target();
        const edgeSourceNode = currentEdge.source();
        const connectedWithHighlightNode = currentEdge.connectedNodes().not(`.${gFilteredClassName}`).filter((ele) => ele !== currentNode);
        if (connectedWithHighlightNode.length === 0) {
          currentEdge.addClass(gFilteredClassName);
        } else {
          targetAndSourceNodeList.push(edgeTargetNode);
          targetAndSourceNodeList.push(edgeSourceNode);
        }
      }
    }
    // Step3 . Edge Highlighting target And source filtered remove
    targetAndSourceNodeList.forEach((node) => { node.removeClass(gFilteredClassName); });

    cytoscapeObject.elements(`.${gFilteredClassName}`).style('opacity', '0.1');
  };

  const resetFilterOnCytoscapeElements = () => {
    const gFilteredClassName = 'g-filtered';
    if (cytoscapeObject) {
      cytoscapeObject.elements(`.${gFilteredClassName}`).style('opacity', '1.0').removeClass(gFilteredClassName);
    }
  };

  const captionChange = (elementType, label, caption) => {
    changeCaptionOnCytoscapeElements(elementType, label, caption);
    setSelectedCaption(caption);

    if (elementType === 'node') {
      const nodeLegendObj = legendData.nodeLegend;
      if (Object.prototype.hasOwnProperty.call(nodeLegendObj, label)) {
        nodeLegendObj[label].caption = caption;
      }
      setLegendData({ ...legendData, nodeLegend: nodeLegendObj });
    } else if (elementType === 'edge') {
      const edgeLegendObj = legendData.edgeLegend;
      if (Object.prototype.hasOwnProperty.call(edgeLegendObj, label)) {
        edgeLegendObj[label].caption = caption;
      }
      setLegendData({ ...legendData, edgeLegend: edgeLegendObj });
    }
    dispatch(() => props.setLabels(elementType, label, { caption }));
  };

  useImperativeHandle(ref, () => ({
    getCy() {
      return cytoscapeObject;
    },
    getLabels() {
      return Object.keys(props.data.legend.nodeLegend);
    },
    getEdges() {
      return Object.keys(props.data.legend.edgeLegend);
    },
    getCaptionsFromCytoscapeObject,
    applyFilterOnCytoscapeElements,
    resetFilterOnCytoscapeElements,
    applyEdgeThicknessCytoscapeElements,
  }));

  return (
    <div className="chart-frame-area">
      <div className="contianer-frame-tab">
        <CypherResultCytoscapeLegend
          onLabelClick={getFooterData}
          isReloading={isReloading}
          legendData={legendData}
        />
        <CypherResultTab
          refKey={props.refKey}
          setIsTable={props.setIsTable}
          currentTab="graph"
        />
      </div>
      <div className="graph-toolbar">
        <button
          type="button"
          className={
            `graph-toolbar-btn${
              showFilters ? ' active' : ''}`
          }
          onClick={() => setShowFilters(!showFilters)}
          title="Faceted Filters"
        >
          <FontAwesomeIcon icon={faFilter} />
          <span>Filters</span>
        </button>
        <button
          type="button"
          className={
            `graph-toolbar-btn${
              showStyling ? ' active' : ''}`
          }
          onClick={() => setShowStyling(!showStyling)}
          title="Node Styling"
        >
          <FontAwesomeIcon icon={faPalette} />
          <span>Style</span>
        </button>
        <button
          type="button"
          className={
            `graph-toolbar-btn${
              showStats ? ' active' : ''}`
          }
          onClick={() => setShowStats(!showStats)}
          title="Graph Statistics"
        >
          <FontAwesomeIcon icon={faChartBar} />
          <span>Stats</span>
        </button>
        <button
          type="button"
          className={
            `graph-toolbar-btn${
              showPathFinder ? ' active' : ''}`
          }
          onClick={() => {
            setShowPathFinder(!showPathFinder);
            if (!showPathFinder) {
              setPathPickMode('source');
              setPathSource(null);
              setPathTarget(null);
            } else {
              setPathPickMode(null);
            }
          }}
          title="Find Path"
        >
          <FontAwesomeIcon icon={faRoute} />
          <span>Path</span>
        </button>
        <button
          type="button"
          className={
            `graph-toolbar-btn${
              showRangeFilter ? ' active' : ''}`
          }
          onClick={() => setShowRangeFilter(
            !showRangeFilter,
          )}
          title="Range Filter"
        >
          <FontAwesomeIcon icon={faSlidersH} />
          <span>Range</span>
        </button>
        <span
          className="graph-toolbar-separator"
        />
        <button
          type="button"
          className={
            `graph-toolbar-btn${
              groupingEnabled ? ' active' : ''}`
          }
          onClick={() => setGroupingEnabled(
            !groupingEnabled,
          )}
          title="Group Nodes"
        >
          <FontAwesomeIcon icon={faObjectGroup} />
          <span>Group</span>
        </button>
        <button
          type="button"
          className={
            `graph-toolbar-btn${
              showAlgorithms ? ' active' : ''}`
          }
          onClick={() => setShowAlgorithms(
            !showAlgorithms,
          )}
          title="Graph Algorithms"
        >
          <FontAwesomeIcon icon={faBrain} />
          <span>Algo</span>
        </button>
        <button
          type="button"
          className={
            `graph-toolbar-btn${
              showTemplates ? ' active' : ''}`
          }
          onClick={() => setShowTemplates(
            !showTemplates,
          )}
          title="Query Templates"
        >
          <FontAwesomeIcon icon={faFileCode} />
          <span>Templates</span>
        </button>
        <button
          type="button"
          className={
            `graph-toolbar-btn${
              showSchema ? ' active' : ''}`
          }
          onClick={() => setShowSchema(!showSchema)}
          title="Graph Schema"
        >
          <FontAwesomeIcon icon={faProjectDiagram} />
          <span>Schema</span>
        </button>
        <span
          className="graph-toolbar-separator"
        />
        <button
          type="button"
          className="graph-toolbar-btn"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <FontAwesomeIcon icon={faUndo} />
        </button>
        <button
          type="button"
          className="graph-toolbar-btn"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <FontAwesomeIcon icon={faRedo} />
        </button>
        <button
          type="button"
          className={
            `graph-toolbar-btn${
              showSnapshots ? ' active' : ''}`
          }
          onClick={() => setShowSnapshots(
            !showSnapshots,
          )}
          title="Snapshots"
        >
          <FontAwesomeIcon icon={faCamera} />
        </button>
        {groupCount > 0 && (
          <span
            className="grouping-toolbar-indicator"
          >
            <strong>{groupCount}</strong>
            {' groups'}
          </span>
        )}
      </div>
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
        }}
      >
        <BatchOperationsBar
          cytoscapeObject={cytoscapeObject}
          selectedCount={selectedCount}
          onBeforeRemove={captureSnapshot}
        />
        <CypherResultCytoscapeChart
          onElementsMouseover={getFooterData}
          onNodeClick={handleNodeClick}
          legendData={legendData}
          elements={elements}
          setCytoscapeObject={setCytoscapeObject}
          cytoscapeObject={cytoscapeObject}
          cytoscapeLayout={cytoscapeLayout}
          addLegendData={addLegendData}
          maxDataOfGraph={maxDataOfGraph}
          graph={props.graph}
          onAddSubmit={props.onAddSubmit}
          onRemoveSubmit={props.onRemoveSubmit}
          openModal={props.openModal}
          addGraphHistory={props.addGraphHistory}
          addElementHistory={props.addElementHistory}
        />
        <GraphSearchBar
          cytoscapeObject={cytoscapeObject}
        />
        <NodeDetailPanel
          nodeData={selectedNodeData}
          onClose={() => setSelectedNodeData(null)}
          cytoscapeObject={cytoscapeObject}
          graph={props.graph}
          onCopyToEditor={handleCopyToEditor}
        />
        <FacetedFilterSidebar
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          cytoscapeObject={cytoscapeObject}
        />
        <StatisticsPanel
          visible={showStats}
          onClose={() => setShowStats(false)}
          cytoscapeObject={cytoscapeObject}
        />
        <NodeStylingPanel
          visible={showStyling}
          onClose={() => setShowStyling(false)}
          cytoscapeObject={cytoscapeObject}
        />
        <PathFinderPanel
          visible={showPathFinder}
          onClose={() => {
            setShowPathFinder(false);
            setPathPickMode(null);
          }}
          cytoscapeObject={cytoscapeObject}
          graph={props.graph}
          sourceNode={pathSource}
          targetNode={pathTarget}
          onPickSource={
            () => setPathPickMode('source')
          }
          onPickTarget={
            () => setPathPickMode('target')
          }
          onClearPicks={() => {
            setPathSource(null);
            setPathTarget(null);
            setPathPickMode('source');
          }}
        />
        <RangeFilterPanel
          visible={showRangeFilter}
          onClose={() => setShowRangeFilter(false)}
          cytoscapeObject={cytoscapeObject}
        />
        <BreadcrumbNav
          trail={breadcrumbTrail}
          cytoscapeObject={cytoscapeObject}
          onNavigate={(idx) => {
            setBreadcrumbTrail(
              (prev) => prev.slice(0, idx + 1),
            );
          }}
        />
        <AlgorithmsPanel
          visible={showAlgorithms}
          onClose={() => setShowAlgorithms(false)}
          cytoscapeObject={cytoscapeObject}
        />
        <SnapshotManager
          visible={showSnapshots}
          onClose={() => setShowSnapshots(false)}
          cytoscapeObject={cytoscapeObject}
          cytoscapeLayout={cytoscapeLayout}
        />
        <QueryTemplatesPanel
          visible={showTemplates}
          onClose={() => setShowTemplates(false)}
          graph={props.graph}
          onExecute={() => {}}
        />
        <SchemaViewer
          visible={showSchema}
          onClose={() => setShowSchema(false)}
          cytoscapeObject={cytoscapeObject}
          graph={props.graph}
        />
        <NodeGrouping
          enabled={groupingEnabled}
          cytoscapeObject={cytoscapeObject}
          onGroupCountChange={setGroupCount}
        />
      </div>
      <ShortcutsHelpOverlay
        visible={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
      <CypherResultCytoscapeFooter
        captions={captions}
        colorChange={colorChange}
        sizeChange={sizeChange}
        captionChange={captionChange}
        setCytoscapeLayout={handleLayoutChange}
        cytoscapeLayout={cytoscapeLayout}
        selectedCaption={selectedCaption}
        footerData={footerData}
        nodeLabelSizes={nodeLabelSizes}
        edgeLabelSizes={edgeLabelSizes}
        edgeLabelColors={edgeLabelColors}
        nodeLabelColors={nodeLabelColors}
      />
    </div>
  );
});

CypherResultCytoscape.propTypes = {
  maxDataOfGraph: PropTypes.number.isRequired,
  data: PropTypes.shape({
    label: PropTypes.string,
    type: PropTypes.string,
    legend: PropTypes.shape({
      // eslint-disable-next-line react/forbid-prop-types
      nodeLegend: PropTypes.any,
      // eslint-disable-next-line react/forbid-prop-types
      edgeLegend: PropTypes.any,
    }).isRequired,
    elements: PropTypes.shape({
      // eslint-disable-next-line react/forbid-prop-types
      edges: PropTypes.any,
      // eslint-disable-next-line react/forbid-prop-types
      nodes: PropTypes.any,
    }).isRequired,
  }).isRequired,
  setLabels: PropTypes.func.isRequired,
  refKey: PropTypes.string.isRequired,
  setChartLegend: PropTypes.func.isRequired,
  graph: PropTypes.string.isRequired,
  onAddSubmit: PropTypes.func.isRequired,
  onRemoveSubmit: PropTypes.func.isRequired,
  openModal: PropTypes.func.isRequired,
  addGraphHistory: PropTypes.func.isRequired,
  addElementHistory: PropTypes.func.isRequired,
  setIsTable: PropTypes.func.isRequired,
  selectedElementId: PropTypes.string,
  onSelectElement: PropTypes.func,
};

CypherResultCytoscape.defaultProps = {
  selectedElementId: null,
  onSelectElement: null,
};

export default CypherResultCytoscape;
