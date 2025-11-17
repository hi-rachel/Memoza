"use client";

import { useEffect } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/notes");
    }
  }, [user, loading, router]);

  if (loading) {
    return <Spinner fullScreen size="lg" />;
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
