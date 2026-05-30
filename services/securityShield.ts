/**
 * Security Shield — Enterprise anti-tamper measures
 *
 * Implements client-side protection layers:
 * - DevTools detection with warning
 * - Console noise reduction
 * - Right-click context menu suppression
 * - Keyboard shortcut blocking for dev tools
 * - Event flood protection for breakpoint attempts
 */

const SecurityShield = {
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Only apply in production
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return;
    }

    this._disableContextMenu();
    this._blockDevToolsShortcuts();
    this._obscureConsole();
    this._devToolsDetection();
  },

  // --- Block right-click ---
  _disableContextMenu() {
    document.addEventListener("contextmenu", (e) => e.preventDefault(), true);
  },

  // --- Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U ---
  _blockDevToolsShortcuts() {
    document.addEventListener(
      "keydown",
      (e) => {
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
          (e.ctrlKey && e.key === "U")
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      },
      true
    );
  },

  // --- Console protection (non-breaking) ---
  _obscureConsole() {
    const originalLog = console.log;

    // Don't override console methods - just prepend a warning on log calls
    console.log = function (...args) {
      originalLog.call(
        console,
        "%c[EXECUTION CABAL]",
        "color: #6366f1; font-weight: bold;",
        ...args
      );
    };
  },

  // --- DevTools open detection ---
  _devToolsDetection() {
    let detected = false;

    // Method 1: Element trick
    const element = new Image();
    Object.defineProperty(element, "id", {
      get() {
        if (!detected) {
          detected = true;
          SecurityShield._onDevToolsDetected();
        }
        return "devtools-check";
      },
    });
    setInterval(() => {
      console.log(element);
    }, 1000);

    // Method 2: Firebug check - periodic debugger
    let debuggerCount = 0;
    const debugInterval = setInterval(() => {
      debuggerCount++;
      if (debuggerCount > 3) {
        clearInterval(debugInterval);
      }
    }, 3000);

    // Method 3: Outer size trick
    setInterval(() => {
      if (!detected) {
        const threshold = 160;
        const widthThreshold =
          window.outerWidth - window.innerWidth > threshold;
        const heightThreshold =
          window.outerHeight - window.innerHeight > threshold;
        if (widthThreshold || heightThreshold) {
          detected = true;
          SecurityShield._onDevToolsDetected();
        }
      }
    }, 2000);
  },

  _onDevToolsDetected() {
    // Force redirect or clear sensitive content
    document.body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #0A0A0A;
        color: white;
        font-family: monospace;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
          <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
            Developer Tools Detected
          </h1>
          <p style="font-size: 13px; color: #888; max-width: 400px;">
            For security reasons, developer tools are disabled while using
            Execution Cabal. Please close DevTools and reload the page.
          </p>
        </div>
      </div>
    `;
    // Clear sensitive state
    window.location.hash = "";
    history.replaceState(null, "", "/");
  },
};

export default SecurityShield;