"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Register page now lives on the flip side of /login
export default function RegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?mode=register");
  }, [router]);
  return null;
}
