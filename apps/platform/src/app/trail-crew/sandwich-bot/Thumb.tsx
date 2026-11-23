"use client";

import { useMemo } from "react";
import { compile } from "@/lib/sandwich-bot/engine";
import { findScript } from "@/lib/sandwich-bot/submissions";
import { viewAt } from "@/lib/sandwich-bot/timeline";
import Stage from "./Stage";

/** The starting kitchen, small, for a gallery card. No spoilers. */
export default function Thumb({ id }: { id: string }) {
  const script = findScript(id);
  const view = useMemo(() => (script ? viewAt(compile(script, []), -1, 0) : null), [script]);
  if (!script || !view) return null;
  return <Stage view={view} title={`${script.title}: starting kitchen`} />;
}
