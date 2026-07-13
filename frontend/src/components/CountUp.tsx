"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export default function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString(),
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: setDisplay,
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span>{format(display)}</span>;
}
