import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { makeTrpcClient, type MobileTrpcClient } from "./trpc";

const TOKEN_KEY = "frms.token";
const USER_KEY = "frms.user";

export type MobileUser = {
  id: string;
  name: string;
  role: string;
  tenantSlug: string;
};

export type AuthStatus = "loading" | "authed" | "anon";

type AuthContextValue = {
  token: string | null;
  user: MobileUser | null;
  status: AuthStatus;
  signIn: (orgSlug: string | undefined, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  trpc: MobileTrpcClient;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // The trpc client reads the CURRENT token via this ref on every request, so a
  // sign-in/sign-out is reflected on the very next call without recreating the client.
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  const trpc = useMemo(
    () => makeTrpcClient(async () => tokenRef.current),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const [storedToken, storedUserRaw] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (cancelled) return;
        if (storedToken && storedUserRaw) {
          setToken(storedToken);
          setUser(JSON.parse(storedUserRaw) as MobileUser);
          setStatus("authed");
        } else {
          setStatus("anon");
        }
      } catch {
        if (!cancelled) setStatus("anon");
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (orgSlug: string | undefined, username: string, password: string) => {
      const result = await trpc.mobileAuth.login.mutate({
        orgSlug: orgSlug && orgSlug.length > 0 ? orgSlug : undefined,
        username,
        password,
      });
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, result.token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(result.user)),
      ]);
      setToken(result.token);
      setUser(result.user);
      setStatus("authed");
    },
    [trpc],
  );

  const signOut = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    setToken(null);
    setUser(null);
    setStatus("anon");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, status, signIn, signOut, trpc }),
    [token, user, status, signIn, signOut, trpc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function useTrpc(): MobileTrpcClient {
  return useAuth().trpc;
}
