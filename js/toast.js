// ============================================================
// js/toast.js — Toast Notification Utility
// SCENTÉ · Week 3
//
// HOW TO USE ON ANY PAGE:
//   <script src="../js/toast.js"></script>
//
//   Then call anywhere in your page JS:
//   showToast("Added to cart!");
//   showToast("Item removed.", "error");
//   showToast("Saved!", "success", 2000);
//
// This file creates and manages a single toast <div> on the page.
// No extra HTML needed — it injects its own element.
// ============================================================


// ── Internal: inject the toast container once ─────────────
(function injectToastContainer() {
  // Only create it once, even if toast.js is loaded multiple times
  if (document.getElementById("scente-toast")) return;

  const toast = document.createElement("div");
  toast.id = "scente-toast";

  // Inline styles so toast works on every page without needing extra CSS
  Object.assign(toast.style, {
    position:       "fixed",
    bottom:         "32px",
    left:           "50%",
    transform:      "translateX(-50%) translateY(12px)",
    zIndex:         "9999",
    padding:        "13px 32px",
    fontFamily:     "var(--font-body, 'Jost', sans-serif)",
    fontSize:       "12px",
    fontWeight:     "500",
    letterSpacing:  "0.1em",
    textTransform:  "uppercase",
    color:          "#ffffff",
    background:     "#1a1a1a",
    opacity:        "0",
    pointerEvents:  "none",
    transition:     "opacity 0.25s ease, transform 0.25s ease",
    whiteSpace:     "nowrap",
    borderRadius:   "0"   // matches the square SCENTÉ aesthetic
  });

  document.body.appendChild(toast);
})();


// ── showToast ─────────────────────────────────────────────
// Displays a brief notification message at the bottom of the screen.
// Auto-hides after `duration` ms.
//
// @param {string} message   — text to display
// @param {string} type      — "success" (default) | "error" | "info"
// @param {number} duration  — ms before it fades out (default 2800)
//
// Examples:
//   showToast("Added to cart!");
//   showToast("Please fill in all fields.", "error");
//   showToast("Changes saved.", "success", 2000);

let _toastTimer = null; // holds the active hide-timer so we can reset it

function showToast(message, type = "success", duration = 2800) {
  const toast = document.getElementById("scente-toast");
  if (!toast) return;

  // Set background colour based on type
  const colours = {
    success: "#1a1a1a",
    error:   "#c0392b",
    info:    "#d4808a"  // brand accent rose
  };
  toast.style.background = colours[type] || colours.success;
  toast.textContent = message;

  // Show
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";

  // Reset any existing hide timer so rapid calls don't cut short
  if (_toastTimer) clearTimeout(_toastTimer);

  // Hide after duration
  _toastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(12px)";
  }, duration);
}