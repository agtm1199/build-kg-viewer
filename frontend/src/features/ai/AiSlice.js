/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const AiSlice = createSlice({
  name: 'ai',
  initialState: {
    messages: [],
    loading: false,
    error: null,
    panelOpen: false,
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateLastMessage: (state, action) => {
      if (state.messages.length > 0) {
        const last = state.messages[state.messages.length - 1];
        if (last.role === 'assistant') {
          last.content += action.payload;
        }
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.error = null;
    },
    togglePanel: (state) => {
      state.panelOpen = !state.panelOpen;
    },
    setPanel: (state, action) => {
      state.panelOpen = action.payload;
    },
  },
});

export const {
  addMessage,
  updateLastMessage,
  setLoading,
  setError,
  clearMessages,
  togglePanel,
  setPanel,
} = AiSlice.actions;

export default AiSlice.reducer;
