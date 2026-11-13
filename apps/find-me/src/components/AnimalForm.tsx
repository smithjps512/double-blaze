"use client";

import { useActionState, useState } from "react";
import { saveAnimal, type AnimalFormState } from "@/app/staff/actions";
import type { Animal } from "@/lib/types";

type Opt = [string, string];

function Pills({ name, options, value, onChange }: { name: string; options: Opt[]; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, l]) => (
        <label
          key={v}
          className="cursor-pointer rounded-full border-2 border-line bg-white px-4 py-2 font-medium focus-within:ring-4 focus-within:ring-sun has-[:checked]:border-ember has-[:checked]:bg-ember-light"
        >
          <input type="radio" name={name} value={v} defaultChecked={value === v} onChange={() => onChange?.(v)} className="sr-only" />
          {l}
        </label>
      ))}
    </div>
  );
}

function Row({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="label">{label}</legend>
      {hint && <p className="-mt-1 text-sm text-muted">{hint}</p>}
      {children}
      {error && (
        <p className="text-sm font-semibold text-ember-dark" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

const LEVELS: Opt[] = [
  ["1", "Low"],
  ["2", "Medium"],
  ["3", "High"],
];
const TRI: Opt[] = [
  ["yes", "Yes"],
  ["no", "No"],
  ["unknown", "Not sure"],
];

/**
 * Phone-first: big tap targets, the camera opens for the photo, and only the
 * first block is required. Target: a new pet listed in under two minutes.
 */
export function AnimalForm({ shelterId, animal, demo }: { shelterId: string; animal?: Animal; demo: boolean }) {
  const [state, action, pending] = useActionState<AnimalFormState, FormData>(saveAnimal, {});
  const [species, setSpecies] = useState<string>(animal?.species ?? "dog");
  const e = state.errors ?? {};
  const a = animal;

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="shelterId" value={shelterId} />
      {a && <input type="hidden" name="animalId" value={a.id} />}

      <section className="card flex flex-col gap-6 p-6">
        <h2 className="font-display text-xl font-extrabold">The basics</h2>
        <label>
          <span className="label">Photo</span>
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="field py-2" />
          {a?.photoUrl && <span className="mt-1 block text-sm text-muted">Leave empty to keep the current photo.</span>}
          {e.photo && <span className="mt-1 block text-sm font-semibold text-ember-dark">{e.photo}</span>}
        </label>
        <label>
          <span className="label">Name</span>
          <input name="name" required maxLength={60} defaultValue={a?.name} className="field" />
          {e.name && <span className="mt-1 block text-sm font-semibold text-ember-dark">{e.name}</span>}
        </label>
        <Row label="Species" error={e.species}>
          <Pills name="species" value={species} onChange={setSpecies} options={[["dog", "Dog"], ["cat", "Cat"]]} />
        </Row>
        <Row label="Sex" error={e.sex}>
          <Pills name="sex" value={a?.sex} options={[["female", "Female"], ["male", "Male"]]} />
        </Row>
        <Row label="Age" error={e.ageGroup}>
          <Pills
            name="ageGroup"
            value={a?.ageGroup}
            options={[
              ["baby", species === "dog" ? "Puppy" : "Kitten"],
              ["young", "Young"],
              ["adult", "Adult"],
              ["senior", "Senior"],
            ]}
          />
          <input name="ageLabel" maxLength={40} defaultValue={a?.ageLabel} className="field" placeholder='Optional, like "about 2 years"' />
        </Row>
        {species === "dog" && (
          <Row label="Size" error={e.size}>
            <Pills
              name="size"
              value={a?.size}
              options={[
                ["small", "Small"],
                ["medium", "Medium"],
                ["large", "Large"],
                ["xlarge", "XL"],
              ]}
            />
          </Row>
        )}
      </section>

      <section className="card flex flex-col gap-6 p-6">
        <div>
          <h2 className="font-display text-xl font-extrabold">Personality</h2>
          <p className="text-sm text-muted">This drives the matching. &ldquo;Not sure&rdquo; is always fine; we never hide a pet for it.</p>
        </div>
        <Row label="Energy">
          <Pills name="energy" value={String(a?.energy ?? 2)} options={LEVELS} />
        </Row>
        <Row label="Good with kids">
          <Pills name="goodWithKids" value={a?.goodWithKids ?? "unknown"} options={TRI} />
        </Row>
        <Row label="Good with dogs">
          <Pills name="goodWithDogs" value={a?.goodWithDogs ?? "unknown"} options={TRI} />
        </Row>
        <Row label="Good with cats">
          <Pills name="goodWithCats" value={a?.goodWithCats ?? "unknown"} options={TRI} />
        </Row>
        <Row label="Training and behavior needs" hint="High means they need an experienced owner.">
          <Pills name="trainingNeeds" value={String(a?.trainingNeeds ?? 1)} options={LEVELS} />
        </Row>
        <Row label="Time alone">
          <Pills
            name="aloneOk"
            value={String(a?.aloneOk ?? 2)}
            options={[
              ["1", "Needs company"],
              ["2", "A few hours"],
              ["3", "A workday is fine"],
            ]}
          />
        </Row>
        <Row label="Grooming needs">
          <Pills name="coatCare" value={String(a?.coatCare ?? 1)} options={LEVELS} />
        </Row>
        <label className="flex items-center gap-3 font-medium">
          <input type="checkbox" name="needsYard" defaultChecked={a?.needsYard} className="h-5 w-5 accent-ember" />
          Needs a home with a fenced yard
        </label>
      </section>

      <section className="card flex flex-col gap-6 p-6">
        <h2 className="font-display text-xl font-extrabold">Their story</h2>
        <label>
          <span className="label">Bio</span>
          <textarea name="bio" rows={4} maxLength={2000} defaultValue={a?.bio} className="field" placeholder="What makes them great? What do they love?" />
        </label>
        <label>
          <span className="label">Breed (your best guess)</span>
          <input name="breed" maxLength={80} defaultValue={a?.breed} className="field" />
          <span className="mt-1 block text-xs text-muted">Shown on the listing. Never used in matching.</span>
        </label>
        <label>
          <span className="label">Special needs</span>
          <input name="specialNeeds" maxLength={500} defaultValue={a?.specialNeeds} className="field" placeholder="Medication, diet, anything an adopter should know" />
        </label>
        <label>
          <span className="label">Adoption fee ($)</span>
          <input name="fee" inputMode="numeric" pattern="[0-9]*" defaultValue={a?.fee ?? ""} className="field max-w-[10rem]" />
          {e.fee && <span className="mt-1 block text-sm font-semibold text-ember-dark">{e.fee}</span>}
        </label>
        {a && (
          <Row label="Status">
            <Pills
              name="status"
              value={a.status}
              options={[
                ["available", "Available"],
                ["on_hold", "On hold"],
                ["adopted", "Adopted"],
              ]}
            />
          </Row>
        )}
      </section>

      {state.error && (
        <p className="rounded-xl bg-ember-light px-4 py-3 text-ember-dark" role="alert">
          {state.error}
        </p>
      )}
      {Object.keys(e).length > 0 && (
        <p className="rounded-xl bg-ember-light px-4 py-3 text-ember-dark" role="alert">
          A few things need fixing above.
        </p>
      )}
      <div className="sticky bottom-16 z-10 flex gap-3 rounded-2xl bg-cream/95 py-3 backdrop-blur sm:bottom-0">
        <button className="btn-primary flex-1 text-lg sm:flex-none" disabled={pending}>
          {pending ? "Saving..." : a ? "Save changes" : "Add to listings"}
        </button>
      </div>
      {demo && <p className="text-sm text-muted">Demo mode: the form works, but nothing is saved.</p>}
    </form>
  );
}
