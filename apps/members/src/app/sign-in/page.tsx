import { resolveTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { SignInForm } from "./form";

/**
 * Sign in, or start the process of joining. The same form does both: someone
 * who has never been here gets an identity and lands on the questionnaire,
 * someone who applied gets their pending notice, and a member gets in. Asking
 * a visitor to pick "sign in" or "sign up" before they know which they are is
 * a question only the system needs answered, and it can answer it itself.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const { error } = await searchParams;

  const message =
    error === "expired"
      ? "That link has expired or was already used. Request a new one below."
      : error === "invalid"
        ? "That sign-in link was not valid. Request a new one below."
        : error === "unconfigured"
          ? "Sign-in is not available right now. Please try again shortly."
          : null;

  return (
    <main>
      <h1>Sign in to {tenant.name}</h1>
      <p className="muted">
        Enter your email and we will send you a link. There is no password to
        remember.
      </p>

      {message ? (
        <p className="notice error" role="alert">
          {message}
        </p>
      ) : null}

      <SignInForm />
    </main>
  );
}
