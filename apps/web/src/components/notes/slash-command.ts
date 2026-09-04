import { Extension, type Range } from "@tiptap/react";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import {
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Minus,
  CheckSquare,
  ImagePlus,
} from "lucide-react";

import {
  SlashCommandMenu,
  type SlashCommandItem,
  type SlashCommandMenuHandle,
} from "./slash-command-menu";

/**
 * FIS-36 Phase 1 — formatting-only slash commands. Entity pickers
 * (@mentions of fisherfolk/vessel/violation) are a LATER phase; do not add
 * them here.
 */
function buildItems(
  editor: Editor,
  range: Range,
  query: string,
  onRequestPhotoInsert: () => void,
): SlashCommandItem[] {
  const all: SlashCommandItem[] = [
    {
      key: "h1",
      title: "Heading 1",
      description: "Big section heading",
      icon: Heading1,
      run: () =>
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
    },
    {
      key: "h2",
      title: "Heading 2",
      description: "Medium section heading",
      icon: Heading2,
      run: () =>
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
    },
    {
      key: "bullet-list",
      title: "Bullet list",
      description: "Unordered list",
      icon: List,
      run: () => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      key: "ordered-list",
      title: "Numbered list",
      description: "Ordered list",
      icon: ListOrdered,
      run: () => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      key: "quote",
      title: "Quote",
      description: "Blockquote",
      icon: Quote,
      run: () => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      key: "divider",
      title: "Divider",
      description: "Horizontal rule",
      icon: Minus,
      run: () => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      key: "task",
      title: "Task",
      description: "Checkbox list item",
      icon: CheckSquare,
      run: () => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
      key: "photo",
      title: "Insert photo",
      description: "Upload an image from your device",
      icon: ImagePlus,
      run: () => {
        editor.chain().focus().deleteRange(range).run();
        onRequestPhotoInsert();
      },
    },
  ];

  if (query.trim() === "") return all;
  const q = query.trim().toLowerCase();
  return all.filter((item) => item.title.toLowerCase().includes(q));
}

export interface SlashCommandOptions {
  /** Called when the "Insert photo" item is chosen — opens the host's file picker. */
  onRequestPhotoInsert: () => void;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      onRequestPhotoInsert: () => {},
    };
  },

  addProseMirrorPlugins() {
    const extensionOptions = this.options;

    const suggestion: Omit<
      SuggestionOptions<SlashCommandItem, SlashCommandItem>,
      "editor"
    > = {
      char: "/",
      startOfLine: false,
      items: ({ query, editor }) =>
        buildItems(
          editor,
          { from: 0, to: 0 },
          query,
          extensionOptions.onRequestPhotoInsert,
        ),
      command: ({ props }) => {
        props.run();
      },
      render: () => {
        let component: ReactRenderer<SlashCommandMenuHandle, {
          items: SlashCommandItem[];
          command: (item: SlashCommandItem) => void;
        }> | null = null;
        let unmount: (() => void) | null = null;

        return {
          onStart: (props) => {
            const items = buildItems(
              props.editor,
              props.range,
              props.query,
              extensionOptions.onRequestPhotoInsert,
            );
            component = new ReactRenderer(SlashCommandMenu, {
              props: {
                items,
                command: (item: SlashCommandItem) => props.command(item),
              },
              editor: props.editor,
            });
            if (!props.clientRect) return;
            unmount = props.mount(component.element);
          },
          onUpdate: (props) => {
            const items = buildItems(
              props.editor,
              props.range,
              props.query,
              extensionOptions.onRequestPhotoInsert,
            );
            component?.updateProps({
              items,
              command: (item: SlashCommandItem) => props.command(item),
            });
          },
          onKeyDown: (props) => {
            if (props.event.key === "Escape") {
              unmount?.();
              component?.destroy();
              return true;
            }
            return component?.ref?.onKeyDown(props.event) ?? false;
          },
          onExit: () => {
            unmount?.();
            component?.destroy();
            component = null;
            unmount = null;
          },
        };
      },
    };

    return [
      Suggestion({
        editor: this.editor,
        ...suggestion,
      }),
    ];
  },
});
