"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { type IdElement } from "@frms/shared/schemas";
import { TemplateCanvas } from "./template-canvas";
import { ElementPalette } from "./element-palette";
import { BackgroundUpload } from "./background-upload";

type Side = "front" | "back";

interface SideState {
  elements: IdElement[];
  backgroundUrl: string | null;
}

interface EditorState {
  front: SideState;
  back: SideState;
  activeSide: Side;
  selectedElementId: string | null;
}

const CANVAS_SCALE = 4; // px per mm → card renders at ~348×224px content area

export function TemplateEditor() {
  const [state, setState] = useState<EditorState>({
    front: { elements: [], backgroundUrl: null },
    back: { elements: [], backgroundUrl: null },
    activeSide: "front",
    selectedElementId: null,
  });

  // Side-specific stable callbacks — each closes over only its own key ("front"|"back")
  // so the inactive canvas cannot write to the wrong side even if it fires a callback.
  const updateFrontElements = useCallback((elements: IdElement[]) => {
    setState((s) => ({ ...s, front: { ...s.front, elements } }));
  }, []);

  const updateBackElements = useCallback((elements: IdElement[]) => {
    setState((s) => ({ ...s, back: { ...s.back, elements } }));
  }, []);

  const updateFrontBackground = useCallback((url: string | null) => {
    setState((s) => ({ ...s, front: { ...s.front, backgroundUrl: url } }));
  }, []);

  const updateBackBackground = useCallback((url: string | null) => {
    setState((s) => ({ ...s, back: { ...s.back, backgroundUrl: url } }));
  }, []);

  function addElement(element: IdElement) {
    const side = state.activeSide;
    setState((s) => ({
      ...s,
      [side]: { ...s[side], elements: [...s[side].elements, element] },
    }));
  }

  function selectElement(id: string | null) {
    setState((s) => ({ ...s, selectedElementId: id }));
  }

  const activeSideState = state[state.activeSide];
  const selectedElement = activeSideState.elements.find(
    (el) => el.id === state.selectedElementId
  );

  return (
    <div className="flex gap-4 items-start">
      {/* ── Left: canvas ───────────────────────────────── */}
      <Card className="flex-1 min-w-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Template Canvas</CardTitle>
            <Badge variant="outline" className="text-xs font-normal">
              86 × 54 mm cut · 88 × 56 mm bleed
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Drag elements to position · arrow keys nudge · click to select
          </p>
        </CardHeader>
        <CardContent>
          <Tabs
            value={state.activeSide}
            onValueChange={(v) => {
              setState((s) => ({
                ...s,
                activeSide: v as Side,
                selectedElementId: null,
              }));
            }}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="front">Front</TabsTrigger>
              <TabsTrigger value="back">Back</TabsTrigger>
            </TabsList>

            {/* Each TabsContent binds to its own stable callback — no closure-capture bug */}
            <TabsContent value="front" className="mt-0">
              <div className="overflow-auto rounded">
                <TemplateCanvas
                  elements={state.front.elements}
                  backgroundUrl={state.front.backgroundUrl}
                  scale={CANVAS_SCALE}
                  onElementsChange={updateFrontElements}
                  selectedElementId={state.selectedElementId}
                  onSelectElement={selectElement}
                />
              </div>
            </TabsContent>

            <TabsContent value="back" className="mt-0">
              <div className="overflow-auto rounded">
                <TemplateCanvas
                  elements={state.back.elements}
                  backgroundUrl={state.back.backgroundUrl}
                  scale={CANVAS_SCALE}
                  onElementsChange={updateBackElements}
                  selectedElementId={state.selectedElementId}
                  onSelectElement={selectElement}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Right: sidebar ─────────────────────────────── */}
      <div className="flex flex-col gap-4 w-56 shrink-0">
        {/* Element palette */}
        <Card>
          <CardContent className="pt-4 pb-3 px-3 h-96 flex flex-col">
            <ElementPalette onAddElement={addElement} />
          </CardContent>
        </Card>

        {/* Background upload — bound to active side */}
        <Card>
          <CardContent className="pt-4 pb-3 px-3">
            <BackgroundUpload
              side={state.activeSide}
              currentUrl={activeSideState.backgroundUrl}
              onUrlChange={
                state.activeSide === "front"
                  ? updateFrontBackground
                  : updateBackBackground
              }
            />
          </CardContent>
        </Card>

        {/* Selected element info */}
        {selectedElement !== undefined && (
          <Card>
            <CardContent className="pt-4 pb-3 px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Selected
              </p>
              <p className="text-xs font-medium capitalize">
                {selectedElement.type}
                {selectedElement.type === "variable"
                  ? ` · ${selectedElement.variableKey}`
                  : ""}
              </p>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <span>X</span>
                <span>{selectedElement.xMm.toFixed(1)} mm</span>
                <span>Y</span>
                <span>{selectedElement.yMm.toFixed(1)} mm</span>
                <span>Width</span>
                <span>{selectedElement.widthMm.toFixed(1)} mm</span>
                <span>Height</span>
                <span>{selectedElement.heightMm.toFixed(1)} mm</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
