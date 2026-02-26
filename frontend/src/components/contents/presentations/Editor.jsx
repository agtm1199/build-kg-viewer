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
import { useDispatch } from 'react-redux';
import uuid from 'react-uuid';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagic,
} from '@fortawesome/free-solid-svg-icons';
import store from '../../../app/store';
import AlertContainers from '../../alert/containers/AlertContainers';
import CodeMirror from '../../editor/containers/CodeMirrorWapperContainer';
import SideBarToggle from '../../editor/containers/SideBarMenuToggleContainer';
import { setting } from '../../../conf/config';
import IconPlay from '../../../icons/IconPlay';
import AiChatPanel from '../../ai/AiChatPanel';
import { getMetaData } from '../../../features/database/MetadataSlice';
import { togglePanel as toggleAiPanel } from '../../../features/ai/AiSlice';

const Editor = ({
  setCommand,
  activeRequests,
  command,
  update,
  addFrame,
  trimFrame,
  addAlert,
  alertList,
  isActive,
  database,
  executeCypherQuery,
  addCommandHistory,
  toggleMenu,
  setLabel, // eslint-disable-line no-unused-vars
  isLabel, // eslint-disable-line no-unused-vars
  addCommandFavorites, // eslint-disable-line no-unused-vars
  removeCommandFavorites, // eslint-disable-line no-unused-vars
  // navigateHistory available for arrow keys
  navigateHistory, // eslint-disable-line no-unused-vars
  resetHistoryIndex,
  commandHistory, // eslint-disable-line no-unused-vars
  commandFavorites, // eslint-disable-line no-unused-vars
}) => {
  const dispatch = useDispatch();
  const [alerts, setAlerts] = useState([]);
  const [activePromises, setPromises] = useState({});

  const onClick = () => {
    const refKey = uuid();
    if (command.toUpperCase().startsWith(':PLAY')) {
      dispatch(() => addFrame(command, 'Contents', refKey));
    } else if (command.toUpperCase().startsWith(':CSV')) {
      dispatch(() => addFrame(command, 'CSV', refKey));
    } else if (command.toUpperCase() === ':SERVER STATUS') {
      dispatch(() => trimFrame('ServerStatus'));
      dispatch(() => addFrame(command, 'ServerStatus', refKey));
    } else if (database.status === 'disconnected' && command.toUpperCase() === ':SERVER DISCONNECT') {
      dispatch(() => trimFrame('ServerDisconnect'));
      dispatch(() => trimFrame('ServerConnect'));
      dispatch(() => addAlert('ErrorNoDatabaseConnected'));
      dispatch(() => addFrame(command, 'ServerDisconnect', refKey));
    } else if (database.status === 'disconnected' && command.toUpperCase() === ':SERVER CONNECT') {
      if (!setting.closeWhenDisconnect) {
        dispatch(() => trimFrame('ServerConnect'));
        dispatch(() => addFrame(':server connect', 'ServerConnect'));
      }
    } else if (database.status === 'disconnected') {
      dispatch(() => trimFrame('ServerConnect'));
      dispatch(() => addAlert('ErrorNoDatabaseConnected'));
      dispatch(() => addFrame(command, 'ServerConnect', refKey));
    } else if (database.status === 'connected' && command.toUpperCase() === ':SERVER DISCONNECT') {
      dispatch(() => trimFrame('ServerDisconnect'));
      dispatch(() => addAlert('NoticeServerDisconnected'));
      dispatch(() => addFrame(command, 'ServerDisconnect', refKey));
    } else if (database.status === 'connected' && command.toUpperCase() === ':SERVER CONNECT') {
      if (!setting.connectionStatusSkip) {
        dispatch(() => trimFrame('ServerStatus'));
        dispatch(() => addAlert('NoticeAlreadyConnected'));
        dispatch(() => addFrame(command, 'ServerStatus', refKey));
      }
    } else if (database.status === 'connected') {
      addFrame(command, 'CypherResultFrame', refKey);
      const req = dispatch(() => executeCypherQuery([refKey, command]));
      req.then((response) => {
        if (response.type === 'cypher/executeCypherQuery/rejected') {
          if (response.error.name !== 'AbortError') {
            dispatch(() => addAlert('ErrorCypherQuery'));
            const currentCommand = store.getState().editor.command;
            if (currentCommand === '') {
              setCommand(command);
            }
          }
          return;
        }
        if (update) dispatch(getMetaData());
      });
      activePromises[refKey] = req;
      setPromises({ ...activePromises });
    }
    dispatch(() => addCommandHistory(command));
    dispatch(() => resetHistoryIndex());
    setCommand('');
  };

  useEffect(() => {
    const reqCancel = Object.keys(activePromises).filter((ref) => !activeRequests.includes(ref));
    reqCancel.forEach((ref) => {
      activePromises[ref].abort();
      delete activePromises[ref];
    });
    setPromises({ ...activePromises });
  }, [activeRequests]);

  useEffect(() => {
    setAlerts(
      alertList.map((alert) => (
        <AlertContainers
          key={alert.alertProps.key}
          alertKey={alert.alertProps.key}
          alertName={alert.alertName}
          errorMessage={alert.alertProps.errorMessage}
        />
      )),
    );
  }, [alertList]);

  return (
    <div className="container-fluid">
      <div
        className="editor"
        style={{ position: 'relative' }}
      >
        <div className="container-fluid editor-area card-header">
          <div className="input-group input-style">
            <div id="codeMirrorEditor" className="form-control col-11 editor-code-wrapper">
              <CodeMirror
                onClick={onClick}
                value={command}
                onChange={setCommand}
              />
            </div>
            <div className="input-group-append ml-auto editor-button-wrapper" id="editor-buttons">
              <button
                className="frame-head-button btn btn-link run-query-btn"
                type="button"
                onClick={() => onClick()}
                title="Run Query"
                aria-label="Run Query"
              >
                <IconPlay />
                <span className="editor-btn-label">Run</span>
              </button>
              <button
                className="frame-head-button btn btn-link ai-btn"
                type="button"
                onClick={() => dispatch(toggleAiPanel())}
                title="AI Assistant"
                aria-label="AI Assistant"
              >
                <FontAwesomeIcon icon={faMagic} />
                <span className="editor-btn-label">AI</span>
              </button>
              <button
                className="frame-head-button btn btn-link sidebar-toggle-btn"
                type="button"
                onClick={() => {
                  toggleMenu('home');
                }}
                title={(isActive) ? 'Hide Sidebar' : 'Show Sidebar'}
                aria-label="toggleMenu"
              >
                <SideBarToggle isActive={isActive} />
                <span className="editor-btn-label">
                  {isActive ? 'Close' : 'Open'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {alerts}
      <AiChatPanel />
    </div>
  );
};

Editor.propTypes = {
  setCommand: PropTypes.func.isRequired,
  activeRequests: PropTypes.arrayOf(PropTypes.string).isRequired,
  command: PropTypes.string.isRequired,
  addFrame: PropTypes.func.isRequired,
  trimFrame: PropTypes.func.isRequired,
  addAlert: PropTypes.func.isRequired,
  alertList: PropTypes.arrayOf(PropTypes.shape({
    alertName: PropTypes.string.isRequired,
    alertProps: PropTypes.shape({
      key: PropTypes.string.isRequired,
      alertType: PropTypes.string.isRequired,
      errorMessage: PropTypes.string.isRequired,
    }),
  })).isRequired,
  isActive: PropTypes.bool.isRequired,
  database: PropTypes.shape({
    status: PropTypes.string.isRequired,
    host: PropTypes.string.isRequired,
  }).isRequired,
  executeCypherQuery: PropTypes.func.isRequired,
  addCommandHistory: PropTypes.func.isRequired,
  toggleMenu: PropTypes.func.isRequired,
  update: PropTypes.bool.isRequired,
  setLabel: PropTypes.func.isRequired,
  isLabel: PropTypes.bool.isRequired,
  addCommandFavorites: PropTypes.func.isRequired,
  removeCommandFavorites: PropTypes.func.isRequired,
  navigateHistory: PropTypes.func.isRequired,
  resetHistoryIndex: PropTypes.func.isRequired,
  commandHistory: PropTypes.arrayOf(
    PropTypes.string,
  ).isRequired,
  commandFavorites: PropTypes.arrayOf(
    PropTypes.string,
  ).isRequired,
};

export default Editor;
