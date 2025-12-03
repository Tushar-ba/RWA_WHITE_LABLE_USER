import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n"; // Import i18n configuration

// Global promise rejection handler for Solana network errors
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's a Solana network error that we expect
  const reason = event.reason;
  if (reason?.message?.includes('Failed to fetch') || 
      reason?.message?.includes('could not find account') ||
      reason?.name === 'TypeError') {
    // Suppress these expected network errors
    event.preventDefault();
    console.warn('Suppressed expected Solana network error:', reason?.message || reason);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
