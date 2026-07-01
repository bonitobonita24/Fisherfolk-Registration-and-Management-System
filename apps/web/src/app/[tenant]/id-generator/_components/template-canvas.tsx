"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { createSnapModifier, restrictToParentElement } from "@dnd-kit/modifiers";
import { ID_CARD_GEOMETRY, type IdElement } from "@frms/shared/schemas";
import { IdCardRenderer, elementPositionStyle, pxFromMm } from "./id-card-renderer";

/** Respects prefers-reduced-motion for WCAG 2.2 SC 2.3.3 */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

interface DraggableElementProps {
  element: IdElement;
  scale: number;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  reducedMotion: boolean;
}

function DraggableElement({
  element,
  scale,
  children,
  isSelected,
  onSelect,
  reducedMotion,
}: DraggableElementProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: element.id });

  const baseStyle = elementPositionStyle(element, scale);
  const transitionStyle: React.CSSProperties =
    !reducedMotion && !isDragging
      ? { transition: "outline-color 0.1s ease" }
      : {};

  const rotationSuffix =
    baseStyle.transform !== undefined ? ` ${baseStyle.transform}` : "";

  return (
    <div
      ref={setNodeRef}
      style={{
        ...baseStyle,
        transform:
          transform !== null
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)${rotationSuffix}`
            : baseStyle.transform,
        cursor: isDragging ? "grabbing" : "grab",
        outline: isSelected
          ? "2px solid hsl(var(--primary))"
          : "1px dashed transparent",
        outlineOffset: 1,
        touchAction: "none",
        ...transitionStyle,
      }}
      {...listeners}
      {...attributes}
      aria-label={`Draggable element: ${element.type}${element.type === "variable" ? ` (${element.variableKey})` : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.id);
      }}
    >
      {children}
    </div>
  );
}

interface TemplateCanvasProps {
  elements: IdElement[];
  backgroundUrl?: string | null;
  scale?: number;
  onElementsChange: (elements: IdElement[]) => void;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
}

export function TemplateCanvas({
  elements,
  backgroundUrl,
  scale = 4,
  onElementsChange,
  selectedElementId,
  onSelectElement,
}: TemplateCanvasProps) {
  const reducedMotion = useReducedMotion();
  // Memoize so DndContext doesn't get a new modifiers array every render
  const snapSize = useMemo(() => pxFromMm(0.5, scale), [scale]); // 0.5mm grid in px

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      // Arrow keys nudge; Space/Enter to pick up and drop
      coordinateGetter: (event, { currentCoordinates }) => {
        const step = snapSize;
        const code = event.code;
        if (code === "ArrowRight")
          return { x: currentCoordinates.x + step, y: currentCoordinates.y };
        if (code === "ArrowLeft")
          return { x: currentCoordinates.x - step, y: currentCoordinates.y };
        if (code === "ArrowDown")
          return { x: currentCoordinates.x, y: currentCoordinates.y + step };
        if (code === "ArrowUp")
          return { x: currentCoordinates.x, y: currentCoordinates.y - step };
        return currentCoordinates;
      },
    })
  );

  const snapModifier = useMemo(() => createSnapModifier(snapSize), [snapSize]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    // Epsilon guard: sub-pixel snap residuals can produce near-zero non-exact deltas
    if (Math.abs(delta.x) < 0.01 && Math.abs(delta.y) < 0.01) return;
    const elementId = String(active.id);
    const dxMm = delta.x / scale;
    const dyMm = delta.y / scale;

    onElementsChange(
      elements.map((el) => {
        if (el.id !== elementId) return el;
        return {
          ...el,
          xMm: clamp(
            el.xMm + dxMm,
            0,
            ID_CARD_GEOMETRY.contentWidthMm - el.widthMm
          ),
          yMm: clamp(
            el.yMm + dyMm,
            0,
            ID_CARD_GEOMETRY.contentHeightMm - el.heightMm
          ),
        };
      })
    );
  }

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToParentElement, snapModifier]}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{ display: "inline-block" }}
        onClick={() => onSelectElement?.(null)}
      >
        <IdCardRenderer
          elements={elements}
          backgroundUrl={backgroundUrl ?? null}
          mode="edit"
          scale={scale}
          renderElement={(el, visual, _style) => (
            <DraggableElement
              key={el.id}
              element={el}
              scale={scale}
              isSelected={selectedElementId === el.id}
              onSelect={(id) => onSelectElement?.(id)}
              reducedMotion={reducedMotion}
            >
              {visual}
            </DraggableElement>
          )}
        />
      </div>
    </DndContext>
  );
}
