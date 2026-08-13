"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Scroll-reveal wrapper for landing sections. Fades + lifts content into view
 * once. Honours `prefers-reduced-motion` (Rule 13 / ui-rules R14): when the
 * user opts out, content renders immediately with no transform.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced === true) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
