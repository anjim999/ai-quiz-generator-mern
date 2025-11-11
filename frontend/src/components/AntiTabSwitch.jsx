// src/components/AntiTabSwitch.jsx
import { useEffect, useRef } from "react";

/** One strike per leave/return cycle, not twice */
export default function AntiTabSwitch({ onStrike, maxStrikes = 3 }) {
  const inBackground = useRef(false);
  const cooling = useRef(false);

  useEffect(() => {
    const handleHiddenChange = () => {
      // when user leaves
      if (document.hidden) {
        inBackground.current = true;
      } else {
        // user came back
        if (inBackground.current && !cooling.current) {
          cooling.current = true;
          onStrike?.("tab-blur");
          setTimeout(() => (cooling.current = false), 1200);
        }
        inBackground.current = false;
      }
    };

    const onBlur = () => {
      inBackground.current = true;
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", handleHiddenChange);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", handleHiddenChange);
    };
  }, [onStrike, maxStrikes]);

  return null;
}
