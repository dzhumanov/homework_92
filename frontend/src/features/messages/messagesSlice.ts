import { createSlice } from "@reduxjs/toolkit";
import { Message } from "../../types";
import { RootState } from "../../app/store";
import { fetchMessages } from "./messagesThunk";

interface MessagesState {
  messages: Message[];
  fetchLoading: boolean;
}

const initialState: MessagesState = {
  messages: [],
  fetchLoading: false,
};

export const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMessages.pending, (state) => {
      state.fetchLoading = true;
    });
    builder.addCase(fetchMessages.fulfilled, (state, { payload: messages }) => {
      state.fetchLoading = false;
      state.messages = messages;
    });
    builder.addCase(fetchMessages.rejected, (state) => {
      state.fetchLoading = false;
    });
  },
});

export const messagesReducer = messagesSlice.reducer;

export const selectMessages = (state: RootState) => state.messages.messages;
export const selectMessagesLoading = (state: RootState) =>
  state.messages.fetchLoading;
