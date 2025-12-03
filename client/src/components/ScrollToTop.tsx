import { useLayoutEffect } from "react";
import { useLocation } from "wouter";

const ScrollToTop = () => {
  const [location] = useLocation();

  useLayoutEffect(() => {
    // Scroll to top instantly when route changes
    document.documentElement.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }, [location]);

  return null;
};

export default ScrollToTop;