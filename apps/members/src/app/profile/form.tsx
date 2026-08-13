"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PHOTO_MIME_TYPES, PROFILE_FIELDS, type Profile } from "@/lib/profile";

/**
 * Editing a profile.
 *
 * The photo uploads on selection rather than on save, because it is the one
 * field with a result worth seeing before committing to the rest, and because
 * a multipart body and a JSON body are different requests anyway.
 *
 * Everything else saves together. Nothing is required, so there is no
 * validation to report: the server truncates what runs long and keeps the rest.
 */
export function ProfileForm({
  initial,
  displayName,
  memberId,
}: {
  initial: Profile;
  displayName: string;
  memberId: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const start: Record<string, string> = { display_name: displayName };
    for (const field of PROFILE_FIELDS) start[field.key] = initial[field.key] ?? "";
    return start;
  });
  const [photoPath, setPhotoPath] = useState<string | undefined>(initial.photo_path);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function set(key: string, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    if (state === "saved") setState("idle");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "That could not be saved.");
        setState("idle");
        return;
      }
      setState("saved");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setState("idle");
    }
  }

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    const body = new FormData();
    body.append("photo", file);
    try {
      const res = await fetch("/api/profile", { method: "PUT", body });
      const data = await res.json().catch(() => ({}));
      setUploading(false);
      if (!res.ok) {
        setError(data.error ?? "That photo could not be uploaded.");
        return;
      }
      setPhotoPath(data.path);
      router.refresh();
    } catch {
      setUploading(false);
      setError("Could not reach the server. Try again.");
    }
  }

  return (
    <form onSubmit={save}>
      <div className="field photo-field">
        {photoPath ? (
          // next/image is not used anywhere in this app: every photo is served
          // by our own authenticated proxy from a private bucket, which the
          // optimizer cannot reach, and the sizes involved are avatars.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar large" src={`/api/media/${photoPath}`} alt="Your profile photo" />
        ) : (
          <div className="avatar large placeholder" aria-hidden="true">
            {(values.display_name || "?").trim().charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <label htmlFor="photo">Photo</label>
          <p className="help">Optional. JPEG, PNG, or WebP, up to 5MB.</p>
          <input
            ref={fileInput}
            id="photo"
            type="file"
            accept={PHOTO_MIME_TYPES.join(",")}
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          {uploading ? <p className="help">Uploading...</p> : null}
        </div>
      </div>

      <div className="field">
        <label htmlFor="display_name">Your name</label>
        <input
          id="display_name"
          type="text"
          maxLength={80}
          autoComplete="name"
          value={values.display_name}
          onChange={(e) => set("display_name", e.target.value)}
        />
      </div>

      {PROFILE_FIELDS.map((field) => (
        <div className="field" key={field.key}>
          <label htmlFor={field.key}>
            {field.label}
            <span className="optional"> (optional)</span>
          </label>
          {field.help ? <p className="help">{field.help}</p> : null}
          {field.kind === "textarea" ? (
            <textarea
              id={field.key}
              rows={field.rows ?? 4}
              maxLength={field.maxLength}
              value={values[field.key]}
              onChange={(e) => set(field.key, e.target.value)}
            />
          ) : (
            <input
              id={field.key}
              type="text"
              maxLength={field.maxLength}
              autoComplete={field.autoComplete}
              value={values[field.key]}
              onChange={(e) => set(field.key, e.target.value)}
            />
          )}
        </div>
      ))}

      {error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : null}
      {state === "saved" ? (
        <p className="notice" role="status">
          Saved. <a href={`/members/${memberId}`}>See how it looks</a>
        </p>
      ) : null}

      <button type="submit" disabled={state === "saving"}>
        {state === "saving" ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
