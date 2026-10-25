import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  checkReceptionRole,
  deleteAccount as deleteAccountRequest,
  displayNameFromMetadata,
  isReceptionEmail,
  receptionSignIn as receptionSignInRequest,
  signIn as signInRequest,
  signOut as signOutRequest,
  signUp as signUpRequest,
} from "@/lib/api";
import { getSupabase, hasSupabaseEnv } from "@/lib/supabase";
import type { ClinicUser } from "@/lib/types";

type ToastTone = "success" | "error";

type ToastState = {
  message: string;
  tone: ToastTone;
} | null;

type ClinicContextValue = {
  ready: boolean;
  configured: boolean;
  user: ClinicUser | null;
  isReception: boolean;
  toast: ToastState;
  showToast: (message: string, tone?: ToastTone) => void;
  hideToast: () => void;
  signIn: (email: string, password: string) => Promise<"patient" | "reception">;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const ClinicContext = createContext<ClinicContextValue | null>(null);

function userFromSession(session: {
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
} | null): ClinicUser | null {
  const email = session?.user.email;
  if (!session || !email) return null;
  return {
    id: session.user.id,
    email,
    name: displayNameFromMetadata(email, session.user.user_metadata),
  };
}

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<ClinicUser | null>(null);
  const [isReception, setIsReception] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToast({ message, tone });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  const applySession = useCallback(async (session: Parameters<typeof userFromSession>[0]) => {
    const nextUser = userFromSession(session);
    setUser(nextUser);
    if (!nextUser) {
      setIsReception(false);
      return;
    }
    if (isReceptionEmail(nextUser.email)) {
      setIsReception(true);
      return;
    }
    try {
      setIsReception(await checkReceptionRole());
    } catch {
      setIsReception(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      void applySession(data.session).finally(() => {
        if (active) setReady(true);
      });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void applySession(session);
      }, 0);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isReceptionEmail(email)) {
      const session = await receptionSignInRequest(email, password);
      await applySession(session);
      return "reception" as const;
    }
    const session = await signInRequest(email, password);
    await applySession(session);
    return "patient" as const;
  }, [applySession]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const session = await signUpRequest(name, email, password);
    await applySession(session);
  }, [applySession]);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
    setIsReception(false);
  }, []);

  const deleteAccount = useCallback(async () => {
    await deleteAccountRequest();
    setUser(null);
    setIsReception(false);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      configured: hasSupabaseEnv(),
      user,
      isReception,
      toast,
      showToast,
      hideToast,
      signIn,
      signUp,
      signOut,
      deleteAccount,
    }),
    [
      ready,
      user,
      isReception,
      toast,
      showToast,
      hideToast,
      signIn,
      signUp,
      signOut,
      deleteAccount,
    ],
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic() {
  const value = useContext(ClinicContext);
  if (!value) throw new Error("useClinic must be used inside ClinicProvider");
  return value;
}
