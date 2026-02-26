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

/* eslint-disable react/react-in-jsx-scope */
import { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable } from '@fortawesome/free-solid-svg-icons';
import IconGraph from '../../icons/IconGraph';

class CypherResultTab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: props.currentTab || 'graph',
    };
    this.refKey = props.refKey;
    this.setIsTable = props.setIsTable;
  }

  render() {
    const { activeTab } = this.state;
    const switchTab = (refKey, tabType) => {
      if (tabType === 'graph') {
        document.getElementById(`${refKey}-graph`).classList.add('selected-frame-tab');
        document.getElementById(`${refKey}-graph`).classList.remove('deselected-frame-tab');
        document.getElementById(`${refKey}-table`).classList.add('deselected-frame-tab');
        document.getElementById(`${refKey}-table`).classList.remove('selected-frame-tab');
      } else if (tabType === 'table') {
        document.getElementById(`${refKey}-table`).classList.add('selected-frame-tab');
        document.getElementById(`${refKey}-table`).classList.remove('deselected-frame-tab');
        document.getElementById(`${refKey}-graph`).classList.add('deselected-frame-tab');
        document.getElementById(`${refKey}-graph`).classList.remove('selected-frame-tab');
      }
      this.setState({ activeTab: tabType });
    };
    return (
      <div className="legend-button-area">
        <button
          className={`legend-tab-btn${activeTab === 'graph' ? ' active' : ''}`}
          type="button"
          onClick={() => { switchTab(this.refKey, 'graph'); this.setIsTable(false); }}
        >
          <IconGraph />
          <span>Graph</span>
        </button>
        <button
          className={`legend-tab-btn${activeTab === 'table' ? ' active' : ''}`}
          type="button"
          onClick={() => { switchTab(this.refKey, 'table'); this.setIsTable(true); }}
        >
          <FontAwesomeIcon icon={faTable} />
          <span>Table</span>
        </button>
      </div>
    );
  }
}

CypherResultTab.propTypes = {
  refKey: PropTypes.string.isRequired,
  currentTab: PropTypes.string.isRequired,
  setIsTable: PropTypes.func.isRequired,
};

export default CypherResultTab;
