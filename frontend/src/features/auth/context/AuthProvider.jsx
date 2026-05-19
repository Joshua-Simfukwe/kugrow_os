import { useEffect, useState } from "react";

import { apiClient, setAuthToken } from "../../../lib/api";
import { AuthContext } from "./AuthContext";

const AUTH_STORAGE_KEY = "kugrow-auth";
const PHONE_VERIFICATION_STORAGE_KEY = "kugrow-phone-verification";

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

function readStoredPhoneVerification() {
  const rawValue = window.sessionStorage.getItem(PHONE_VERIFICATION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    window.sessionStorage.removeItem(PHONE_VERIFICATION_STORAGE_KEY);
    return null;
  }
}

function writeStoredPhoneVerification(challenge) {
  window.sessionStorage.setItem(
    PHONE_VERIFICATION_STORAGE_KEY,
    JSON.stringify(challenge),
  );
}

function clearStoredPhoneVerification() {
  window.sessionStorage.removeItem(PHONE_VERIFICATION_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const storedSession = readStoredSession();
  const storedPhoneVerification = readStoredPhoneVerification();
  const [token, setToken] = useState(storedSession?.token ?? null);
  const [user, setUser] = useState(storedSession?.user ?? null);
  const [phoneVerificationChallenge, setPhoneVerificationChallenge] = useState(
    storedPhoneVerification ?? null,
  );
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
    setPhoneVerificationChallenge(null);
    setIsLoading(false);
    clearStoredPhoneVerification();
    writeStoredSession({
      token: nextToken,
      user: nextUser,
    });
  }

  function storePhoneVerificationChallenge(challenge) {
    setPhoneVerificationChallenge(challenge);
    writeStoredPhoneVerification(challenge);
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
    storePhoneVerificationChallenge(response.data);
    return response.data;
  }

  async function verifyPhoneCode(code) {
    const response = await apiClient.post("/auth/phone-verification/verify/", {
      challenge_id: phoneVerificationChallenge?.challenge_id,
      code,
    });
    storeSession(response.data.token, response.data.user);
    return response.data.user;
  }

  async function resendPhoneCode() {
    const response = await apiClient.post("/auth/phone-verification/resend/", {
      challenge_id: phoneVerificationChallenge?.challenge_id,
    });
    storePhoneVerificationChallenge(response.data);
    return response.data;
  }

  function cancelPhoneVerification() {
    setPhoneVerificationChallenge(null);
    clearStoredPhoneVerification();
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
      clearStoredPhoneVerification();
      setToken(null);
      setUser(null);
      setPhoneVerificationChallenge(null);
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
        isPhoneVerificationPending: Boolean(phoneVerificationChallenge) && !token,
        phoneVerificationChallenge,
        signup,
        login,
        verifyPhoneCode,
        resendPhoneCode,
        cancelPhoneVerification,
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
