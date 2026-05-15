import { useEffect, useState } from "react";

import { apiClient, setAuthToken } from "../../../lib/api";
import { AuthContext } from "./AuthContext";

const AUTH_STORAGE_KEY = "kugrow-auth";

function readStoredSession() {
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function writeStoredSession(session) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const storedSession = readStoredSession();
  const [token, setToken] = useState(storedSession?.token ?? null);
  const [user, setUser] = useState(storedSession?.user ?? null);
  const [isLoading, setIsLoading] = useState(Boolean(storedSession?.token));

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isActive = true;

    async function bootstrap() {
      try {
        const response = await apiClient.get("/auth/me/");
        if (!isActive) {
          return;
        }

        setUser(response.data);
        writeStoredSession({
          token,
          user: response.data,
        });
      } catch {
        if (!isActive) {
          return;
        }

        clearStoredSession();
        setToken(null);
        setUser(null);
        setAuthToken(null);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isActive = false;
    };
  }, [token]);

  function storeSession(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    setIsLoading(false);
    writeStoredSession({
      token: nextToken,
      user: nextUser,
    });
  }

  async function refreshUser() {
    const response = await apiClient.get("/auth/me/");
    setUser(response.data);
    writeStoredSession({
      token,
      user: response.data,
    });
    return response.data;
  }

  async function signup(payload) {
    const response = await apiClient.post("/auth/signup/", payload);
    storeSession(response.data.token, response.data.user);
    return response.data.user;
  }

  async function login(payload) {
    const response = await apiClient.post("/auth/login/", payload);
    storeSession(response.data.token, response.data.user);
    return response.data.user;
  }

  async function logout() {
    try {
      if (token) {
        await apiClient.post("/auth/logout/");
      }
    } catch {
      // Clear the local session even if the server token was already invalid.
    } finally {
      clearStoredSession();
      setToken(null);
      setUser(null);
      setIsLoading(false);
      setAuthToken(null);
    }
  }

  async function createOrganization(payload) {
    await apiClient.post("/auth/organizations/create/", payload);
    return refreshUser();
  }

  async function selectOrganization(organizationId) {
    await apiClient.post("/auth/organizations/select/", {
      organization_id: organizationId,
    });
    return refreshUser();
  }

  async function joinOrganization(joinCode) {
    await apiClient.post("/auth/organizations/join/", {
      join_code: joinCode,
    });
    return refreshUser();
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        isAuthenticated: Boolean(token),
        signup,
        login,
        logout,
        refreshUser,
        createOrganization,
        selectOrganization,
        joinOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
