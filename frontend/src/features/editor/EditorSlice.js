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

/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const EditorSlice = createSlice({
  name: 'editor',
  initialState: {
    command: '',
    updateClause: false,
    commandHistory: [],
    commandFavorites: [],
    historyIndex: -1,
  },
  reducers: {
    setCommand: {
      reducer: (state, action) => {
        state.command = action.payload.command;
        state.updateClause = action.payload.command.match(/(CREATE|REMOVE|DELETE)/g) !== null;
      },
      prepare: (command) => ({ payload: { command } }),
    },
    addCommandHistory: {
      reducer: (state, action) => {
        state.commandHistory.push(action.payload.command);
      },
      prepare: (command) => ({ payload: { command } }),
    },
    addCommandFavorites: {
      reducer: (state, action) => {
        if (!state.commandFavorites.includes(
          action.payload.command,
        )) {
          state.commandFavorites.push(
            action.payload.command,
          );
        }
      },
      prepare: (command) => ({ payload: { command } }),
    },
    removeCommandFavorites: {
      reducer: (state, action) => {
        state.commandFavorites = (
          state.commandFavorites.filter(
            (c) => c !== action.payload.command,
          )
        );
      },
      prepare: (command) => ({ payload: { command } }),
    },
    navigateHistory: {
      reducer: (state, action) => {
        const { direction } = action.payload;
        const len = state.commandHistory.length;
        if (direction === 'up' && len > 0) {
          state.historyIndex = Math.min(
            state.historyIndex + 1,
            len - 1,
          );
          const idx = len - 1 - state.historyIndex;
          state.command = state.commandHistory[idx];
        } else if (direction === 'down') {
          state.historyIndex = Math.max(
            state.historyIndex - 1,
            -1,
          );
          if (state.historyIndex < 0) {
            state.command = '';
          } else {
            const idx = (
              len - 1 - state.historyIndex
            );
            state.command = (
              state.commandHistory[idx]
            );
          }
        }
      },
      prepare: (direction) => (
        { payload: { direction } }
      ),
    },
    resetHistoryIndex: (state) => {
      state.historyIndex = -1;
    },
  },
});

export const {
  setCommand,
  addCommandHistory,
  addCommandFavorites,
  removeCommandFavorites,
  navigateHistory,
  resetHistoryIndex,
} = EditorSlice.actions;

export default EditorSlice.reducer;
