import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";
import { getUser } from "../services/users";
import type { ApiUser } from "../services/users";

export function useUserDetails(id: number) {
  const { token } = useAuth();
  const [state, setState] = useState<{ user: ApiUser | null; loading: boolean; error: string }>({
    user: null,
    loading: true,
    error: "",
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ user: null, loading: true, error: "" });
    if (!Number.isSafeInteger(id) || id < 1 || !token) {
      setState({ user: null, loading: false, error: "Usuário não encontrado." });
      return;
    }
    getUser(id, token, controller.signal)
      .then((user) => {
        if (!controller.signal.aborted) setState({ user, loading: false, error: "" });
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setState({ user: null, loading: false, error: errorMessage(cause) });
      });
    return () => controller.abort();
  }, [id, token, attempt]);
  return {
    ...state,
    setUser: (user: ApiUser) => setState({ user, loading: false, error: "" }),
    reload: () => setAttempt((value) => value + 1),
  };
}
