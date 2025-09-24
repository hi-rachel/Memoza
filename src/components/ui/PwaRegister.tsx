"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const url = "/service-worker.js";
    const register = async () => {
      try {
        await navigator.serviceWorker.register(url, { scope: "/" });
      } catch {
        // no-op: avoid console noise in production
      }
    };

    // Safari iOS 17+ and modern browsers
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      window.removeEventListener("load", register as EventListener);
    };
  }, []);

  return null;
}
