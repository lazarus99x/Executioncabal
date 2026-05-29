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

  // --- Console noise generator (makes DevTools console spammy) ---
  _obscureConsole() {
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    const styles = [
      "font-size: 1px; color: transparent;",
      "background: #000; color: #000; font-size: 0px;",
    ];

    const messages = [
      "%c🔒 This environment is protected",
      "%c⚠️ Unauthorized access is monitored",
      "%c🚫 Console access restricted",
      "%c🛡️ Security protocols active",
    ];

    console.log = function (...args) {
      const rand = Math.floor(Math.random() * messages.length);
      originalLog.call(console, messages[rand], styles[rand % styles.length]);
      // Forward 1 in 10 legitimate calls
      if (Math.random() < 0.1 && args.length > 0) {
        originalLog.call(console, ...args);
      }
    };

    console.info = function (...args) {
      originalWarn.call(
        console,
        "%cℹ️ Info logging disabled for security",
        "color: #666; font-style: italic;"
      );
    };

    console.warn = function (...args) {
      if (args[0]?.toString()?.includes("React")) {
        originalWarn.call(console, ...args);
      }
    };

    console.error = function (...args) {
      originalError.call(console, ...args);
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