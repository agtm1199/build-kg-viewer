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

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Row } from 'react-bootstrap';
import { Select, Modal } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSync, faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import EditorContainer from '../../contents/containers/Editor';
import Sidebar from '../../sidebar/containers/Sidebar';
import Contents from '../../contents/containers/Contents';
import ModalComponent from '../../modal/containers/Modal';
import { loadFromCookie, saveToCookie } from '../../../features/cookie/CookieUtil';
import { getMetaData, changeCurrentGraph } from '../../../features/database/MetadataSlice';
import { changeGraph } from '../../../features/database/DatabaseSlice';
import { addFrame, trimFrame } from '../../../features/frame/FrameSlice';
import './DefaultTemplate.scss';

const DefaultTemplate = ({
  theme,
  maxNumOfFrames,
  maxNumOfHistories,
  maxDataOfGraph,
  maxDataOfTable,
  changeSettings,
  isOpen,
}) => {
  const dispatch = useDispatch();
  const dbStatus = useSelector((state) => state.database.status);
  const currentGraph = useSelector((state) => state.metadata.currentGraph);
  const graphs = useSelector(
    (state) => Object.entries(state.metadata.graphs)
      .map(([k, v]) => [k, v.id]),
  );
  const { confirm } = Modal;

  const [stateValues] = useState({
    theme,
    maxNumOfFrames,
    maxNumOfHistories,
    maxDataOfGraph,
    maxDataOfTable,
  });

  const handleGraphChange = (_, option) => {
    dispatch(changeCurrentGraph({ id: option['data-gid'] }));
    dispatch(changeGraph({ graphName: option.value }));
  };

  const handleRefresh = () => {
    dispatch(getMetaData({ currentGraph }));
  };

  const handleDisconnect = () => {
    confirm({
      title: 'Are you sure you want to disconnect?',
      onOk() {
        dispatch(trimFrame('ServerDisconnect'));
        dispatch(addFrame(':server disconnect', 'ServerDisconnect', `disconnect-${Date.now()}`));
      },
    });
  };

  useEffect(() => {
    let isChanged = false;
    const cookieState = {
      theme,
      maxNumOfFrames,
      maxNumOfHistories,
      maxDataOfGraph,
      maxDataOfTable,
    };

    Object.keys(stateValues).forEach((key) => {
      let fromCookieValue = loadFromCookie(key);

      if (fromCookieValue !== undefined && key !== 'theme') {
        fromCookieValue = parseInt(fromCookieValue, 10);
      }

      if (fromCookieValue === undefined) {
        saveToCookie(key, stateValues[key]);
      } else if (fromCookieValue !== stateValues[key]) {
        cookieState[key] = fromCookieValue;
        isChanged = true;
      }
    });

    if (isChanged) {
      dispatch(() => changeSettings(Object.assign(stateValues, cookieState)));
    }
  });

  return (
    <div className="default-template">
      { isOpen && <ModalComponent /> }
      <input
        type="radio"
        className="theme-switch"
        name="theme-switch"
        id="default-theme"
        checked={theme === 'default'}
        readOnly
      />
      <input
        type="radio"
        className="theme-switch"
        name="theme-switch"
        id="dark-theme"
        checked={theme === 'dark'}
        readOnly
      />
      <Row className="content-row">
        <div className="editor-division wrapper-extension-padding">
          <div className="editor-top-bar">
            <div className="top-bar-left">
              <div className="connection-indicator">
                <span className={`connection-indicator-dot ${dbStatus === 'connected' ? 'connected' : ''}`} />
                <span>{dbStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
              </div>
              {dbStatus === 'connected' && graphs.length > 0 && (
                <Select
                  className="graph-select"
                  size="small"
                  value={currentGraph || undefined}
                  placeholder="Select Graph"
                  onChange={handleGraphChange}
                  dropdownMatchSelectWidth={false}
                >
                  {graphs.map(([gname, gid]) => (
                    <Select.Option key={gname} value={gname} data-gid={gid}>
                      {gname}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </div>
            <div className="top-bar-right">
              <button
                className="top-bar-btn refresh-btn"
                type="button"
                onClick={handleRefresh}
                title="Refresh Metadata"
                aria-label="Refresh"
              >
                <FontAwesomeIcon icon={faSync} />
              </button>
              <button
                className="top-bar-btn disconnect-btn"
                type="button"
                onClick={handleDisconnect}
                title="Disconnect"
                aria-label="Disconnect"
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            </div>
          </div>
          <EditorContainer />
          <Sidebar />
          <Contents />
        </div>
      </Row>

    </div>
  );
};

DefaultTemplate.propTypes = {
  theme: PropTypes.string.isRequired,
  maxNumOfFrames: PropTypes.number.isRequired,
  maxNumOfHistories: PropTypes.number.isRequired,
  maxDataOfGraph: PropTypes.number.isRequired,
  maxDataOfTable: PropTypes.number.isRequired,
  changeSettings: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default DefaultTemplate;
