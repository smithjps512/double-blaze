"use client";

import { useActionState } from "react";
import { createShelter, inviteStaff, type AdminState } from "@/app/admin/actions";
import type { Shelter } from "@/lib/types";

function Result({ state }: { state: AdminState }) {
  if (state.ok) return <p className="rounded-xl bg-pine-light px-4 py-3 text-sm text-pine" role="status">{state.ok}</p>;
  if (state.error) return <p className="rounded-xl bg-ember-light px-4 py-3 text-sm text-ember-dark" role="alert">{state.error}</p>;
  return null;
}

export function NewShelterForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(createShelter, {});
  return (
    <form action={action} className="card grid gap-4 p-6 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="label">Shelter name</span>
        <input name="name" required className="field" />
      </label>
      <label>
        <span className="label">City</span>
        <input name="city" className="field" />
      </label>
      <label>
        <span className="label">Inquiry email</span>
        <input name="email" type="email" className="field" placeholder="Where adopter inquiries go" />
      </label>
      <label>
        <span className="label">Phone</span>
        <input name="phone" className="field" />
      </label>
      <label>
        <span className="label">Website</span>
        <input name="website" type="url" className="field" placeholder="https://" />
      </label>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <Result state={state} />
        <button className="btn-primary self-start" disabled={pending}>
          Add shelter
        </button>
      </div>
    </form>
  );
}

export function InviteStaffForm({ shelters }: { shelters: Shelter[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(inviteStaff, {});
  return (
    <form action={action} className="card grid gap-4 p-6 sm:grid-cols-[2fr_2fr_1fr]">
      <label>
        <span className="label">Email</span>
        <input name="email" type="email" required className="field" />
      </label>
      <label>
        <span className="label">Shelter</span>
        <select name="shelterId" required className="field">
          {shelters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="label">Role</span>
        <select name="role" className="field">
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
        </select>
      </label>
      <div className="flex flex-col gap-3 sm:col-span-3">
        <Result state={state} />
        <button className="btn-primary self-start" disabled={pending || shelters.length === 0}>
          Invite
        </button>
      </div>
    </form>
  );
}
