import { useEffect } from "react";

export function useSmartBack() {
  const goBack = () => {
    // Use native browser back but scroll to top afterwards
    window.history.back();
    
    // Small delay to ensure navigation completes, then scroll to top
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant"
      });
    }, 100);
  };

  return { goBack };
}