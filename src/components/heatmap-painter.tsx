"use client";

import { useId, useRef, useState } from "react";
import { ACTIVITY_AI_LABELS, type ActivityAILabel } from "@/lib/activity-ai/types";
import { CAM_CELLS, CAM_GRID } from "@/lib/inference/attention";
import { applyStroke, BRUSH_SIZE, dab, DEFAULT_BRUSH, emptyMask, strokeTo, type Brush, type GridPoint } from "@/lib/heatmap-brush";
import { drawOverlay } from "@/components/attention-heatmap";
import { button } from "@/components/controls";

const textClass = "m-0 text-caption leading-normal text-(--text-secondary)";
const selectClass = "min-h-[32px] max-w-full rounded-control border border-(--border-strong) bg-(--surface-sunken) px-[10px] text-caption text-(--text-primary)";
const sliderLabelClass = "flex min-w-0 items-center gap-[7px] text-caption text-(--text-secondary)";
const HISTORY_LIMIT = 50;

type Stroke = { offset: number; start: number[]; mask: number[]; last: GridPoint };

/**
 * Paints one 14x14 map per finding over the X-ray with an adjustable round brush (size, strength, hardness),
 * with undo and redo. `values` holds all 14 labels' maps (2744 cells) in label order, the same layout as the AI's
 * class activation maps. Used by the Professor's answer key and the Student's answer.
 */
export function HeatmapPainter({ imageUrl, labels, values, onChange, resetTo, disabled = false, describe }: {
  imageUrl: string | null;
  labels: readonly ActivityAILabel[];
  values: number[];
  onChange: (next: number[]) => void;
  // The Professor's "Reset to AI": restores the current finding's slice from these maps.
  resetTo?: number[] | null;
  disabled?: boolean;
  describe?: (label: ActivityAILabel) => string | null;
}) {
  const brushName = useId();
  const [editing, setEditing] = useState<ActivityAILabel | null>(null);
  const [brush, setBrush] = useState<Brush>(DEFAULT_BRUSH);
  const [cursor, setCursor] = useState(0);
  const [hover, setHover] = useState<GridPoint | null>(null);
  const [history, setHistory] = useState<{ past: number[][]; future: number[][] }>({ past: [], future: [] });
  const stroke = useRef<Stroke | null>(null);
  const paintable: ActivityAILabel[] = labels.filter((label) => label !== "No Finding");
  const current = editing && paintable.includes(editing) ? editing : paintable[0] ?? null;
  if (!current) return null;
  const offset = ACTIVITY_AI_LABELS.indexOf(current) * CAM_CELLS;

  const remember = () => setHistory(({ past }) => ({ past: [...past.slice(1 - HISTORY_LIMIT), values], future: [] }));
  /** Replaces the current finding's slice; every other finding's map is left as it is. */
  const write = (at: number, slice: number[]) => {
    const next = [...values];
    next.splice(at, CAM_CELLS, ...slice);
    onChange(next);
  };
  const commit = (slice: number[]) => { remember(); write(offset, slice); };
  const undo = () => {
    const previous = history.past.at(-1);
    if (!previous || disabled) return;
    setHistory({ past: history.past.slice(0, -1), future: [values, ...history.future] });
    onChange(previous);
  };
  const redo = () => {
    const [next, ...rest] = history.future;
    if (!next || disabled) return;
    setHistory({ past: [...history.past, values], future: rest });
    onChange(next);
  };
  const resize = (step: number) => setBrush((current) => ({ ...current, size: Math.min(BRUSH_SIZE.max, Math.max(BRUSH_SIZE.min, current.size + step)) }));

  const toGrid = (event: React.PointerEvent<HTMLCanvasElement>): GridPoint => {
    const box = event.currentTarget.getBoundingClientRect();
    const clamp = (value: number) => Math.min(CAM_GRID - 0.001, Math.max(0, value));
    return { x: clamp(((event.clientX - box.left) / box.width) * CAM_GRID), y: clamp(((event.clientY - box.top) / box.height) * CAM_GRID) };
  };
  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || event.button !== 0) return;
    const point = toGrid(event);
    const start = values.slice(offset, offset + CAM_CELLS);
    const mask = dab(emptyMask(), point, brush);
    stroke.current = { offset, start, mask, last: point };
    setCursor(Math.floor(point.y) * CAM_GRID + Math.floor(point.x));
    remember();
    write(offset, applyStroke(start, mask, brush.erase));
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = toGrid(event);
    setHover(point);
    const active = stroke.current;
    if (!active || !(event.buttons & 1)) return;
    active.mask = strokeTo(active.mask, active.last, point, brush);
    active.last = point;
    write(active.offset, applyStroke(active.start, active.mask, brush.erase));
  };
  const endStroke = () => { stroke.current = null; };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "z") (event.shiftKey ? redo : undo)();
    else if ((event.ctrlKey || event.metaKey) && key === "y") redo();
    else if (event.ctrlKey || event.metaKey || event.altKey) return;
    else if (key === "[") resize(-1);
    else if (key === "]") resize(1);
    else if (key === "b") setBrush({ ...brush, erase: false });
    else if (key === "e") setBrush({ ...brush, erase: true });
    else return;
    event.preventDefault();
  };
  // On the canvas: arrows move the outlined cell, Space or Enter places one dab there with the current brush.
  const onCanvasKeyDown = (event: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -CAM_GRID, ArrowDown: CAM_GRID }[event.key];
    if (step !== undefined) {
      setCursor((cell) => {
        const next = cell + step;
        const sameRow = Math.abs(step) !== 1 || Math.floor(next / CAM_GRID) === Math.floor(cell / CAM_GRID);
        return sameRow && next >= 0 && next < CAM_CELLS ? next : cell;
      });
    } else if ((event.key === " " || event.key === "Enter") && !disabled) {
      const point = { x: (cursor % CAM_GRID) + 0.5, y: Math.floor(cursor / CAM_GRID) + 0.5 };
      commit(applyStroke(values.slice(offset, offset + CAM_CELLS), dab(emptyMask(), point, brush), brush.erase));
    } else return;
    event.preventDefault();
  };
  const note = describe?.(current);
  const outline = (point: GridPoint) => ({
    left: `${(point.x / CAM_GRID) * 100}%`, top: `${(point.y / CAM_GRID) * 100}%`,
    width: `${(brush.size / CAM_GRID) * 100}%`, height: `${(brush.size / CAM_GRID) * 100}%`,
  });
  const percent = (value: number) => `${Math.round(value * 100)}%`;

  return <div className="grid min-w-0 gap-2.5" onKeyDown={onKeyDown}>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-(--text-secondary)">
      <label className="flex items-center gap-[7px]">Finding
        <select className={selectClass} value={current} onChange={(event) => setEditing(event.target.value as ActivityAILabel)}>
          {paintable.map((label) => <option key={label} value={label}>{label}{describe?.(label) ? ` (${describe(label)})` : ""}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-[7px]"><input className="size-[15px] accent-brand" type="radio" name={brushName} checked={!brush.erase} disabled={disabled} onChange={() => setBrush({ ...brush, erase: false })} /> Mark</label>
      <label className="flex items-center gap-[7px]"><input className="size-[15px] accent-brand" type="radio" name={brushName} checked={brush.erase} disabled={disabled} onChange={() => setBrush({ ...brush, erase: true })} /> Erase</label>
    </div>
    <fieldset className="m-0 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 border-0 p-0" disabled={disabled}>
      <legend className="sr-only">Brush</legend>
      <label className={sliderLabelClass}>Size
        <input className="w-[min(120px,28vw)] accent-brand" type="range" min={BRUSH_SIZE.min} max={BRUSH_SIZE.max} step={1} value={brush.size} onChange={(event) => setBrush({ ...brush, size: Number(event.target.value) })} />
        <span className="shrink-0 whitespace-nowrap tabular-nums">{brush.size} {brush.size === 1 ? "cell" : "cells"}</span>
      </label>
      <label className={sliderLabelClass}>Strength
        <input className="w-[min(120px,28vw)] accent-brand" type="range" min={0.1} max={1} step={0.05} value={brush.strength} onChange={(event) => setBrush({ ...brush, strength: Number(event.target.value) })} />
        <span className="shrink-0 whitespace-nowrap tabular-nums">{percent(brush.strength)}</span>
      </label>
      <label className={sliderLabelClass}>Hardness
        <input className="w-[min(120px,28vw)] accent-brand" type="range" min={0} max={1} step={0.05} value={brush.hardness} onChange={(event) => setBrush({ ...brush, hardness: Number(event.target.value) })} />
        <span className="shrink-0 whitespace-nowrap tabular-nums">{percent(brush.hardness)}</span>
      </label>
    </fieldset>
    <div className="flex flex-wrap items-center gap-2">
      <button className={button("secondary")} type="button" disabled={disabled || !history.past.length} onClick={undo} aria-keyshortcuts="Control+Z">Undo</button>
      <button className={button("secondary")} type="button" disabled={disabled || !history.future.length} onClick={redo} aria-keyshortcuts="Control+Shift+Z">Redo</button>
      <button className={button("secondary")} type="button" disabled={disabled || !values.slice(offset, offset + CAM_CELLS).some((value) => value > 0)} onClick={() => commit(emptyMask())}>Clear this finding</button>
      {resetTo !== undefined ? <button className={button("secondary")} type="button" disabled={disabled || !resetTo} onClick={() => commit(resetTo!.slice(offset, offset + CAM_CELLS))}>Reset to AI</button> : null}
    </div>
    <p className={textClass}>Shortcuts: [ and ] change the size, B marks, E erases, Ctrl+Z undoes, Ctrl+Shift+Z redoes.</p>
    {note ? <p className={textClass}>{current}: {note}</p> : null}
    {imageUrl ? <div style={{ position: "relative", maxWidth: 448, overflow: "hidden" }}>
      {/* Native image keeps the private signed URL out of an image proxy. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Chest X-ray to mark" style={{ display: "block", width: "100%", filter: "grayscale(1)" }} />
      <canvas width={112} height={112} tabIndex={disabled ? -1 : 0} role="application"
        aria-label={`Heatmap painter for ${current}. Drag to paint, or use the arrow keys to move and Space to paint with the brush.`}
        ref={(canvas) => drawOverlay(canvas, values.slice(offset, offset + CAM_CELLS), CAM_GRID)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onCanvasKeyDown}
        className="peer cursor-none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.55, touchAction: "none" }} />
      {hover ? <span aria-hidden="true" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/60%)]" style={outline(hover)} /> : null}
      <span aria-hidden="true" className="pointer-events-none absolute hidden -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/60%)] peer-focus-visible:block"
        style={outline({ x: (cursor % CAM_GRID) + 0.5, y: Math.floor(cursor / CAM_GRID) + 0.5 })} />
    </div> : <p className={textClass}>The case image is unavailable. Reload to mark the heatmap.</p>}
  </div>;
}
