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

import { connect } from 'react-redux';
import CypherResultCytoscape from '../presentations/CypherResultCytoscape';
import { setLabels } from '../../../features/cypher/CypherSlice';
import { openModal, addGraphHistory, addElementHistory } from '../../../features/modal/ModalSlice';
import { generateCytoscapeElement } from '../../../features/cypher/CypherUtil';

const EMPTY_DATA = {
  legend: { nodeLegend: {}, edgeLegend: {} },
  elements: { nodes: [], edges: [] },
};

const makeMapStateToProps = () => {
  let cachedRows = null;
  let cachedMaxData = null;
  let cachedResult = EMPTY_DATA;

  return (state, ownProps) => {
    const { refKey } = ownProps;
    const rows = state.cypher.queryResult[refKey]
      ? state.cypher.queryResult[refKey].rows
      : undefined;
    const maxData = state.setting.maxDataOfGraph;

    if (rows !== cachedRows || maxData !== cachedMaxData) {
      cachedRows = rows;
      cachedMaxData = maxData;
      try {
        cachedResult = generateCytoscapeElement(rows, maxData, false);
      } catch (e) {
        console.error(e);
        cachedResult = EMPTY_DATA;
      }
    }

    return {
      data: cachedResult,
      maxDataOfGraph: maxData,
      maxDataOfTable: state.setting.maxDataOfTable,
      setChartLegend: ownProps.setChartLegend,
      graph: state.database.graph,
      selectedElementId: ownProps.selectedElementId,
      onSelectElement: ownProps.onSelectElement,
    };
  };
};

const mapDispatchToProps = {
  setLabels,
  openModal,
  addGraphHistory,
  addElementHistory,
};

export default connect(
  makeMapStateToProps,
  mapDispatchToProps,
  null,
  { forwardRef: true },
)(CypherResultCytoscape);
