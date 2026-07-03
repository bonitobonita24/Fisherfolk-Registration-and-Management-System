"use client";

import { useCallback, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { type IdElement } from "@frms/shared/schemas";
import { TemplateCanvas } from "./template-canvas";
import { ElementPalette } from "./element-palette";
import { BackgroundUpload } from "./background-upload";
import { ElementInspector } from "./element-inspector";
import { TemplateForm, type TemplateFormValues } from "./template-form";
import { TemplateManager } from "./template-manager";

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

interface TemplateEditorProps {
  canManage: boolean;
}

const CANVAS_SCALE = 4; // px per mm

export function TemplateEditor({ canManage }: TemplateEditorProps) {
  const [state, setState] = useState<EditorState>({
    front: { elements: [], backgroundUrl: null },
    back: { elements: [], backgroundUrl: null },
    activeSide: "front",
    selectedElementId: null,
  });

  const [formValues, setFormValues] = useState<TemplateFormValues>({
    name: "",
    templateType: "FISHERFOLK",
    status: "ACTIVE",
  });

  // null = create mode; string = update mode
  const [templateId, setTemplateId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const create = trpc.idTemplate.create.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.status === "ACTIVE"
          ? "Template created and set active — the ID Generator will use it."
          : "Template created.",
      );
      setTemplateId(data.id);
      void utils.idTemplate.list.invalidate();
      void utils.idTemplate.getActive.invalidate();
    },
    onError: (err) => toast.error(err.message || "Create failed."),
  });

  const update = trpc.idTemplate.update.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.status === "ACTIVE"
          ? "Template updated — it is the active template used by the ID Generator."
          : "Template updated.",
      );
      void utils.idTemplate.list.invalidate();
      void utils.idTemplate.getActive.invalidate();
    },
    onError: (err) => toast.error(err.message || "Update failed."),
  });

  const duplicate = trpc.idTemplate.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Duplicated — archived copy created.");
      void utils.idTemplate.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Duplicate failed."),
  });

  // ── Side-specific stable callbacks (no stale-closure wrong-side-write) ──
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

  function updateSelectedElement(updated: IdElement) {
    setState((s) => {
      const side = s.activeSide;
      return {
        ...s,
        [side]: {
          ...s[side],
          elements: s[side].elements.map((el) =>
            el.id === updated.id ? updated : el
          ),
        },
      };
    });
  }

  function deleteSelectedElement() {
    setState((s) => {
      const side = s.activeSide;
      const id = s.selectedElementId;
      return {
        ...s,
        [side]: {
          ...s[side],
          elements: s[side].elements.filter((el) => el.id !== id),
        },
        selectedElementId: null,
      };
    });
  }

  // Load a saved template into editor state (called from TemplateManager "Edit")
  const loadTemplate = useCallback(
    async (id: string) => {
      try {
        const tpl = await utils.idTemplate.getById.fetch({ id });
        setTemplateId(tpl.id);
        setFormValues({
          name: tpl.name,
          templateType: tpl.templateType,
          status: tpl.status,
        });
        setState({
          front: {
            elements: (tpl.frontElements as IdElement[]) ?? [],
            backgroundUrl: tpl.frontBackgroundUrl ?? null,
          },
          back: {
            elements: (tpl.backElements as IdElement[]) ?? [],
            backgroundUrl: tpl.backBackgroundUrl ?? null,
          },
          activeSide: "front",
          selectedElementId: null,
        });
        toast.success(`Loaded "${tpl.name}".`);
      } catch {
        toast.error("Could not load template.");
      }
    },
    [utils]
  );

  function handleSave() {
    const payload = {
      name: formValues.name.trim(),
      templateType: formValues.templateType,
      status: formValues.status,
      frontElements: state.front.elements,
      backElements: state.back.elements,
      frontBackgroundUrl: state.front.backgroundUrl ?? undefined,
      backBackgroundUrl: state.back.backgroundUrl ?? undefined,
    };

    if (templateId) {
      update.mutate({ id: templateId, data: { id: templateId, ...payload } });
    } else {
      create.mutate(payload);
    }
  }

  const isSaving = create.isPending || update.isPending;
  const activeSideState = state[state.activeSide];
  const selectedElement = activeSideState.elements.find(
    (el) => el.id === state.selectedElementId
  );

  return (
    <div className="space-y-6">
      {/* ── Template form header ─────────────────────────── */}
      {canManage && (
        <TemplateForm
          values={formValues}
          isEditMode={!!templateId}
          isSaving={isSaving}
          onChange={(updates) =>
            setFormValues((v) => ({ ...v, ...updates }))
          }
          onSave={handleSave}
        />
      )}

      {/* ── Editor ──────────────────────────────────────── */}
      <div className="flex gap-4 items-start">
        {/* Left: canvas */}
        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Template Canvas</CardTitle>
              <div className="flex items-center gap-2">
                {templateId && canManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => duplicate.mutate({ id: templateId })}
                    disabled={duplicate.isPending}
                    aria-label="Duplicate this template"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Duplicate
                  </Button>
                )}
                <Badge variant="outline" className="text-xs font-normal">
                  86 × 54 mm cut · 88 × 56 mm bleed
                </Badge>
              </div>
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

        {/* Right: sidebar */}
        <div className="flex flex-col gap-4 w-60 shrink-0">
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

          {/* Element inspector — replaces plain info panel */}
          {selectedElement !== undefined && (
            <Card>
              <CardContent className="pt-4 pb-3 px-3">
                <ElementInspector
                  element={selectedElement}
                  onChange={updateSelectedElement}
                  onDelete={deleteSelectedElement}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Template manager ─────────────────────────────── */}
      <div className="space-y-3">
        <Separator />
        <div>
          <h2 className="text-base font-semibold">Saved Templates</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click <span className="font-medium">Edit</span> to load a template
            into the canvas above.
          </p>
        </div>
        <TemplateManager
          canManage={canManage}
          onEditTemplate={(id) => void loadTemplate(id)}
        />
      </div>
    </div>
  );
}
