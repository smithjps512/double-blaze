import { resolveTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { SignInForm } from "./form";
import { titleFor } from "@/lib/metadata";

/**
 * Sign in, or start the process of joining. The same form does both: someone
 * who has never been here gets an identity and lands on the questionnaire,
 * someone who applied gets their pending notice, and a member gets in. Asking
 * a visitor to pick "sign in" or "sign up" before they know which they are is
 * a question only the system needs answered, and it can answer it itself.
 */
/**
 * What went wrong with an invitation, in the invitee's terms.
 *
 * Each one is a different next step, which is why they are not collapsed into
 * "that did not work". Somebody who already used their link should try signing
 * in; somebody whose link expired needs a new one; somebody whose invitation
 * was withdrawn needs to talk to a person, and no amount of retrying will help.
 */
const INVITE_MESSAGES: Record<string, { text: string; tone: "error" | "ok" }> = {
  ready: {
    text: "Your membership is set up. Enter your email below and we will send you a link to sign in.",
    tone: "ok",
  },
  accepted: {
    text: "That invitation has already been used. If it was you, sign in below with the same address.",
    tone: "error",
  },
  expired: {
    text: "That invitation has expired. Ask whoever invited you to send another.",
    tone: "error",
  },
  revoked: {
    text: "That invitation was withdrawn. Please contact whoever invited you.",
    tone: "error",
  },
  invalid: {
    text: "That invitation link was not valid. Check you copied the whole link, or ask for another.",
    tone: "error",
  },
  failed: {
    text: "Something went wrong setting up your membership. Ask whoever invited you to send another invitation.",
    tone: "error",
  },
  unconfigured: {
    text: "Invitations are not available right now. Please try again shortly.",
    tone: "error",
  },
};

export function generateMetadata() {
  return titleFor("Sign in");
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invite?: string }>;
}) {
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const { error, invite } = await searchParams;

  const message =
    error === "expired"
      ? "That link has expired or was already used. Request a new one below."
      : error === "invalid"
        ? "That sign-in link was not valid. Request a new one below."
        : error === "unconfigured"
          ? "Sign-in is not available right now. Please try again shortly."
          : null;

  const inviteMessage = invite ? INVITE_MESSAGES[invite] : undefined;

  return (
    <main className="reading">
      <h1>Sign in to {tenant.name}</h1>
      <p className="muted">
        Enter your email and we will send you a link. There is no password to
        remember.
      </p>

      {inviteMessage ? (
        <p
          className={inviteMessage.tone === "error" ? "notice error" : "notice"}
          role={inviteMessage.tone === "error" ? "alert" : "status"}
        >
          {inviteMessage.text}
        </p>
      ) : null}

      {message ? (
        <p className="notice error" role="alert">
          {message}
        </p>
      ) : null}

      <SignInForm />
    </main>
  );
}
