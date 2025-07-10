"use client";

import {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthContextType = {
  user: User | null | undefined;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthUser() {
  return useContext(AuthContext);
}
