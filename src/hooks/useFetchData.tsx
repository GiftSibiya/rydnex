import { useEffect, useMemo, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigation } from "@react-navigation/native";
import { AuthStore } from "@/stores/StoresIndex";

type FetchFunction = () => void;
type FetchFunctionWithParams = (...params: any[]) => void;
type FetchFunctionUnion = FetchFunction | FetchFunctionWithParams;

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  const decoded: { exp: number } = jwtDecode(token);
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

export const useFetchData = (fetchFunction: FetchFunctionUnion, ...params: any[]) => {
  // Vars
  const navigation: any = useNavigation();
  // Stores
  const { accessToken, logout } = AuthStore();
  const hasHandledInvalidSession = useRef(false);
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  const handleInvalidSession = (message: string) => {
    if (hasHandledInvalidSession.current) return;
    hasHandledInvalidSession.current = true;
    console.error(message);
    logout();
    navigation.navigate("AuthStack");
  };

  useEffect(() => {
    if (!accessToken) {
      handleInvalidSession("No session user found");
      return;
    }
    try {
      if (isTokenExpired(accessToken)) {
        handleInvalidSession("Session token is expired");
        return;
      }
      // Valid token: allow future invalid-session handling when token changes.
      hasHandledInvalidSession.current = false;
    } catch (error) {
      handleInvalidSession("Invalid session token");
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    try {
      if (isTokenExpired(accessToken)) return;
    } catch {
      return;
    }

    if (params.length > 0) {
      (fetchFunction as FetchFunctionWithParams)(...params);
    } else {
      (fetchFunction as FetchFunction)();
    }
  }, [accessToken, fetchFunction, paramsKey]);
};
