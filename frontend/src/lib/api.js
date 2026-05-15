import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
});

export function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Token ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
}
