import { createAsyncThunk } from "@reduxjs/toolkit";
import { Message } from "../../types";
import axiosApi from "../../axiosApi";

export const fetchMessages = createAsyncThunk<Message[]>(
  "messages/fetchAll",
  async () => {
    const response = await axiosApi.get<Message[]>("/messages");
    return response.data;
  }
);
