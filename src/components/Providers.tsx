import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { isClerkEnabled } from "@/lib/auth";

/**
 * Wraps the app in ClerkProvider only when Clerk is configured. Without keys,
 * children render directly so the public storefront has no auth dependency.
 */
export function Providers({ children }: { children: ReactNode }) {
  if (!isClerkEnabled) {
    return <>{children}</>;
  }
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: "#CF4420" },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
