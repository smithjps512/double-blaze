"use client";

import { useActionState, useState } from "react";
import { createReport, type FormState } from "@/app/lost-found/actions";
import type { LatLng } from "@/lib/geo";
import { LocationPicker } from "./map/LocationPicker";

function Pills({ name, options, value, onChange }: { name: string; options: [string, string][]; value?: string; onChange?: (v: string) => void }) {
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

function Err({ msg }: { msg?: string }) {
  return msg ? (
    <p className="mt-1 text-sm font-semibold text-ember-dark" role="alert">
      {msg}
    </p>
  ) : null;
}

export function ReportForm({ initialKind, center, today }: { initialKind: "lost" | "found"; center: LatLng; today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createReport, {});
  const [kind, setKind] = useState(initialKind);
  const [species, setSpecies] = useState("dog");
  const e = state.errors ?? {};
  const lost = kind === "lost";

  return (
    <form action={action} className="flex flex-col gap-6">
      <section className="card flex flex-col gap-5 p-6">
        <fieldset>
          <legend className="label">This pet is</legend>
          <Pills name="kind" value={kind} onChange={(v) => setKind(v as "lost" | "found")} options={[["lost", "Lost (mine)"], ["found", "Found (not mine)"]]} />
        </fieldset>
        <fieldset>
          <legend className="label">Species</legend>
          <Pills name="species" value={species} onChange={setSpecies} options={[["dog", "Dog"], ["cat", "Cat"]]} />
          <Err msg={e.species} />
        </fieldset>
        {lost && (
          <label>
            <span className="label">Their name</span>
            <input name="name" maxLength={60} className="field" />
            <Err msg={e.name} />
          </label>
        )}
        <label>
          <span className="label">Photo {lost ? "(a clear recent one helps most)" : "(if you can, without showing your home)"}</span>
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="field py-2" />
          <Err msg={e.photo} />
        </label>
        <label>
          <span className="label">Colors and markings</span>
          <input name="colors" maxLength={80} className="field" placeholder="Black with white paws" />
          <Err msg={e.colors} />
        </label>
        {species === "dog" && (
          <fieldset>
            <legend className="label">Size</legend>
            <Pills name="size" options={[["small", "Small"], ["medium", "Medium"], ["large", "Large"], ["xlarge", "XL"]]} />
            <Err msg={e.size} />
          </fieldset>
        )}
        <fieldset>
          <legend className="label">Sex</legend>
          <Pills name="sex" value="unknown" options={[["female", "Female"], ["male", "Male"], ["unknown", "Not sure"]]} />
        </fieldset>
        <fieldset>
          <legend className="label">Microchipped?</legend>
          <Pills name="microchipped" value="unknown" options={[["yes", "Yes"], ["no", "No"], ["unknown", "Not sure"]]} />
        </fieldset>
        <label>
          <span className="label">Anything else that helps</span>
          <textarea
            name="description"
            rows={3}
            maxLength={1000}
            className="field"
            placeholder={lost ? "Temperament, collar, whether to approach or call them" : "Where they are now, how they are doing"}
          />
        </label>
      </section>

      <section className="card flex flex-col gap-5 p-6">
        <h2 className="font-display text-xl font-extrabold">{lost ? "Last seen" : "Where you found them"}</h2>
        <label>
          <span className="label">Date</span>
          <input name="seenOn" type="date" max={today} defaultValue={today} className="field max-w-[12rem]" />
          <Err msg={e.seenOn} />
        </label>
        <label>
          <span className="label">Area, in words</span>
          <input name="areaText" maxLength={120} className="field" placeholder="Near Main St park" />
          <span className="mt-1 block text-xs text-muted">Shown publicly. A landmark or cross street, not your address.</span>
          <Err msg={e.areaText} />
        </label>
        <LocationPicker center={center} error={e.location} />
      </section>

      <section className="card flex flex-col gap-3 border-2 border-sun p-6">
        <h2 className="font-display text-xl font-extrabold">Your secret ID detail</h2>
        <p className="text-sm">
          {lost
            ? "Something about your pet that is not in the photo or description: a scar, a tag color, a quirk. When someone says they found your pet, we ask them to describe it and show you their answer next to this. It is the best way to spot a scam."
            : "Something about this pet that is not in the photo or description. When someone says this pet is theirs, we ask them to describe it and show you their answer next to this, so you only hand the pet to the real owner."}
        </p>
        <input name="secretDetail" maxLength={200} className="field" placeholder={lost ? "Notch in her left ear" : "Pink spot on the nose"} />
        <span className="text-xs text-muted">Private. Only you and partner shelter staff ever see it.</span>
        <Err msg={e.secretDetail} />
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
      <button className="btn-primary self-start text-lg" disabled={pending}>
        {pending ? "Posting..." : lost ? "Post and alert shelters" : "Post found pet"}
      </button>
    </form>
  );
}
