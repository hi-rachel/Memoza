"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface PinContextType {
  pin: string | null;
  setPin: (pin: string) => void;
  clearPin: () => void;
}

const PinContext = createContext<PinContextType>({
  pin: null,
  setPin: () => {},
  clearPin: () => {},
});

export function PinProvider({ children }: { children: ReactNode }) {
  const [pin, setPinState] = useState<string | null>(null);

  // 마운트 시 sessionStorage에서 pin 복원
  useEffect(() => {
    const savedPin = window.sessionStorage.getItem("memoza_pin_value");
    if (savedPin) setPinState(savedPin);
  }, []);

  const setPin = (p: string) => {
    setPinState(p);
    window.sessionStorage.setItem("memoza_pin_value", p);
  };
  const clearPin = () => {
    setPinState(null);
    window.sessionStorage.removeItem("memoza_pin_value");
  };
  return (
    <PinContext.Provider value={{ pin, setPin, clearPin }}>
      {children}
    </PinContext.Provider>
  );
}

export function usePin() {
  return useContext(PinContext);
}
