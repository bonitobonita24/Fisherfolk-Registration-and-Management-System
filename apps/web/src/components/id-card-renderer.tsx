"use client";

import React from "react";
import Image from "next/image";
import {
  ID_CARD_GEOMETRY,
  TEMPLATE_VARIABLES,
  type IdElement,
} from "@frms/shared/schemas";

export type CardData = Record<string, string>;

export interface IdCardRendererProps {
  elements: IdElement[];
  backgroundUrl?: string | null;
  data?: CardData;
  /** edit = variables as labelled placeholders; print = variables resolved from data */
  mode?: "edit" | "print";
  /** pixels per mm — controls display size */
  scale?: number;
  className?: string;
  /** Optional render prop so TemplateCanvas can inject drag wrappers per element */
  renderElement?: (
    element: IdElement,
    visual: React.ReactNode,
    style: React.CSSProperties
  ) => React.ReactNode;
}

export function pxFromMm(mm: number, scale: number): number {
  return mm * scale;
}

export function elementPositionStyle(
  el: IdElement,
  scale: number
): React.CSSProperties {
  return {
    position: "absolute",
    left: pxFromMm(el.xMm, scale),
    top: pxFromMm(el.yMm, scale),
    width: pxFromMm(el.widthMm, scale),
    height: pxFromMm(el.heightMm, scale),
    transform: el.rotation !== 0 ? `rotate(${el.rotation}deg)` : undefined,
    zIndex: el.zIndex,
    overflow: "hidden",
    boxSizing: "border-box",
  };
}

function getVariableLabel(key: string): string {
  return TEMPLATE_VARIABLES.find((v) => v.key === key)?.label ?? key;
}

function fontSizePx(pt: number): number {
  return (pt * 96) / 72;
}

export function ElementVisual({
  element,
  mode,
  scale,
  data,
}: {
  element: IdElement;
  mode: "edit" | "print";
  scale: number;
  data?: CardData;
}) {
  const isEdit = mode === "edit";

  switch (element.type) {
    case "text":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent:
              element.align === "center"
                ? "center"
                : element.align === "right"
                  ? "flex-end"
                  : "flex-start",
            fontSize: fontSizePx(element.fontSizePt),
            fontWeight: element.fontWeight,
            color: element.color,
            fontFamily: element.fontFamily,
            textAlign: element.align,
          }}
        >
          {element.content}
        </div>
      );

    case "variable": {
      const label = getVariableLabel(element.variableKey);
      const varMeta = TEMPLATE_VARIABLES.find((v) => v.key === element.variableKey);
      // Image-kind variables (photo, signature, qr URLs) render as <img> in print mode
      if (!isEdit && varMeta?.kind === "image") {
        const imageUrl = data?.[element.variableKey];
        if (imageUrl) {
          return (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <Image
                src={imageUrl}
                alt={label}
                fill
                sizes={`${Math.round(pxFromMm(element.widthMm, scale))}px`}
                style={{ objectFit: "contain" }}
                unoptimized
              />
            </div>
          );
        }
        return null;
      }
      const displayValue = isEdit
        ? `{${label}}`
        : (data?.[element.variableKey] ?? label);
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent:
              element.align === "center"
                ? "center"
                : element.align === "right"
                  ? "flex-end"
                  : "flex-start",
            fontSize: fontSizePx(element.fontSizePt),
            fontWeight: element.fontWeight,
            color: isEdit ? "#6b7280" : element.color,
            fontFamily: element.fontFamily,
            textAlign: element.align,
            border: isEdit ? "1px dashed #d1d5db" : undefined,
            borderRadius: isEdit ? 2 : undefined,
            padding: isEdit ? "0 2px" : undefined,
          }}
        >
          {displayValue}
        </div>
      );
    }

    case "image":
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Image
            src={element.url}
            alt=""
            fill
            sizes={`${Math.round(pxFromMm(element.widthMm, scale))}px`}
            style={{ objectFit: "contain" }}
            unoptimized
          />
        </div>
      );

    case "icon":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize:
              pxFromMm(Math.min(element.widthMm, element.heightMm), scale) *
              0.7,
          }}
        >
          {element.emoji ?? "🖼"}
        </div>
      );

    case "photo": {
      const photoUrl = !isEdit
        ? (data?.["{{photo}}"] ?? data?.["{{vessel_photo}}"] ?? null)
        : null;
      if (photoUrl) {
        return (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <Image
              src={photoUrl}
              alt="Photo"
              fill
              sizes={`${Math.round(pxFromMm(element.widthMm, scale))}px`}
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </div>
        );
      }
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize:
              pxFromMm(Math.min(element.widthMm, element.heightMm), scale) *
              0.25,
            border: isEdit ? "1px dashed #d1d5db" : undefined,
            borderRadius: 2,
          }}
        >
          {isEdit ? "📷 Photo" : null}
        </div>
      );
    }

    case "signature": {
      const sigUrl = !isEdit ? (data?.["{{signature}}"] ?? null) : null;
      if (sigUrl) {
        return (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <Image
              src={sigUrl}
              alt="Signature"
              fill
              sizes={`${Math.round(pxFromMm(element.widthMm, scale))}px`}
              style={{ objectFit: "contain" }}
              unoptimized
            />
          </div>
        );
      }
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            borderBottom: "1px solid #6b7280",
            color: "#9ca3af",
            fontSize: pxFromMm(element.heightMm, scale) * 0.3,
            paddingBottom: 2,
          }}
        >
          {isEdit ? "✍ Signature" : null}
        </div>
      );
    }

    case "qr": {
      const qrUrl = !isEdit
        ? (data?.["{{qr_code}}"] ?? data?.["{{vessel_qr_code}}"] ?? null)
        : null;
      if (qrUrl) {
        return (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <Image
              src={qrUrl}
              alt="QR Code"
              fill
              sizes={`${Math.round(pxFromMm(element.widthMm, scale))}px`}
              style={{ objectFit: "contain" }}
              unoptimized
            />
          </div>
        );
      }
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: isEdit ? "#f3f4f6" : "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: isEdit ? "1px dashed #d1d5db" : undefined,
            borderRadius: 2,
            color: "#9ca3af",
            fontSize:
              pxFromMm(Math.min(element.widthMm, element.heightMm), scale) *
              0.3,
          }}
        >
          {isEdit ? "QR" : null}
        </div>
      );
    }
  }
}

/** Reusable presentational component — renders one card face. dnd-kit-free. */
export function IdCardRenderer({
  elements,
  backgroundUrl,
  data,
  mode = "print",
  scale = 4,
  className,
  renderElement,
}: IdCardRendererProps) {
  const {
    contentWidthMm,
    contentHeightMm,
    bleedWidthMm,
    bleedHeightMm,
    bleedMarginMm,
  } = ID_CARD_GEOMETRY;

  const bleedW = pxFromMm(bleedWidthMm, scale);
  const bleedH = pxFromMm(bleedHeightMm, scale);
  const bleedPx = pxFromMm(bleedMarginMm, scale);
  const cardW = pxFromMm(contentWidthMm, scale);
  const cardH = pxFromMm(contentHeightMm, scale);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: bleedW,
        height: bleedH,
        backgroundColor: mode === "edit" ? "#f9fafb" : "transparent",
        flexShrink: 0,
      }}
      role="img"
      aria-label={`ID card ${mode === "edit" ? "canvas" : "preview"}`}
    >
      {/* Bleed boundary guide (edit only) */}
      {mode === "edit" && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            border: "1px dashed #9ca3af",
            pointerEvents: "none",
            zIndex: 50,
          }}
        />
      )}

      {/* Card content area */}
      <div
        style={{
          position: "absolute",
          left: bleedPx,
          top: bleedPx,
          width: cardW,
          height: cardH,
          backgroundColor: "white",
          overflow: "hidden",
          boxShadow:
            mode === "edit"
              ? "0 0 0 1px #e5e7eb, 0 1px 3px rgba(0,0,0,0.1)"
              : undefined,
        }}
      >
        {backgroundUrl && (
          <Image
            src={backgroundUrl}
            alt=""
            fill
            sizes={`${Math.round(cardW)}px`}
            style={{ objectFit: "cover" }}
            unoptimized
          />
        )}

        {elements.map((el) => {
          const style = elementPositionStyle(el, scale);
          const visual = (
            <ElementVisual
              element={el}
              mode={mode}
              scale={scale}
              {...(data !== undefined ? { data } : {})}
            />
          );

          if (renderElement) {
            return (
              <React.Fragment key={el.id}>
                {renderElement(el, visual, style)}
              </React.Fragment>
            );
          }

          return (
            <div key={el.id} style={style}>
              {visual}
            </div>
          );
        })}
      </div>
    </div>
  );
}
