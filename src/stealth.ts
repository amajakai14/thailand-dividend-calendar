import type { BrowserContext } from 'playwright';

/**
 * Applies manual stealth patches to a Playwright BrowserContext.
 * Covers the fingerprint vectors that Incapsula/PerimeterX/Cloudflare
 * use to detect headless Chrome — no external plugin required.
 */
export async function applyStealthPatches(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    // ── 1. navigator.webdriver ─────────────────────────────────────────────
    // Primary headless signal. Must be false (real Chrome never exposes it).
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
      configurable: true,
    });

    // ── 2. navigator.plugins ───────────────────────────────────────────────
    // Headless Chrome returns empty PluginArray. Real Chrome has 3 built-ins.
    const fakePlugins = [
      { name: 'Chrome PDF Plugin',  filename: 'internal-pdf-viewer',             description: 'Portable Document Format', length: 1 },
      { name: 'Chrome PDF Viewer',  filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '',                         length: 1 },
      { name: 'Native Client',      filename: 'internal-nacl-plugin',             description: '',                         length: 2 },
    ];
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const arr = Object.assign([], fakePlugins, { length: fakePlugins.length });
        Object.setPrototypeOf(arr, (PluginArray as unknown as { prototype: object }).prototype);
        return arr;
      },
      configurable: true,
    });

    // ── 3. navigator.mimeTypes ─────────────────────────────────────────────
    const fakeMimes = [
      { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
      { type: 'application/pdf',                  suffixes: 'pdf', description: '' },
    ];
    Object.defineProperty(navigator, 'mimeTypes', {
      get: () => {
        const arr = Object.assign([], fakeMimes, { length: fakeMimes.length });
        Object.setPrototypeOf(arr, (MimeTypeArray as unknown as { prototype: object }).prototype);
        return arr;
      },
      configurable: true,
    });

    // ── 4. navigator.languages ─────────────────────────────────────────────
    Object.defineProperty(navigator, 'languages', {
      get: () => ['th-TH', 'th', 'en-US', 'en'],
      configurable: true,
    });

    // ── 5. navigator.platform / vendor ─────────────────────────────────────
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32', configurable: true });
    Object.defineProperty(navigator, 'vendor',   { get: () => 'Google Inc.', configurable: true });

    // ── 6. navigator.hardwareConcurrency / deviceMemory ────────────────────
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8,  configurable: true });
    Object.defineProperty(navigator, 'deviceMemory',        { get: () => 8,  configurable: true });

    // ── 7. navigator.maxTouchPoints ────────────────────────────────────────
    // Desktop real Chrome = 0. Headless was once 1, giving it away.
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0, configurable: true });

    // ── 8. window.chrome ───────────────────────────────────────────────────
    // Headless completely lacks window.chrome. Bots check for this.
    if (!(window as unknown as Record<string, unknown>)['chrome']) {
      Object.defineProperty(window, 'chrome', {
        value: {
          app: {
            isInstalled: false,
            InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
            RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
          },
          runtime: {
            id: undefined,
            connect:           () => {},
            sendMessage:       () => {},
            onConnect:         { addListener: () => {}, removeListener: () => {}, hasListeners: () => false },
            onMessage:         { addListener: () => {}, removeListener: () => {}, hasListeners: () => false },
            onInstalled:       { addListener: () => {}, removeListener: () => {}, hasListeners: () => false },
            OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
          },
          loadTimes:     () => ({}),
          csi:           () => ({}),
        },
        writable:     false,
        configurable: true,
      });
    }

    // ── 9. Permissions API ─────────────────────────────────────────────────
    // Headless returns 'denied' for notifications query; real Chrome returns 'default'.
    if (navigator.permissions) {
      const origQuery = navigator.permissions.query.bind(navigator.permissions);
      navigator.permissions.query = (parameters: PermissionDescriptor) => {
        if ((parameters as { name: string }).name === 'notifications') {
          return Promise.resolve({ state: 'default', onchange: null } as unknown as PermissionStatus);
        }
        return origQuery(parameters);
      };
    }

    // ── 10. Notification.permission ────────────────────────────────────────
    // Headless reports 'denied' automatically; spoof to 'default'.
    try {
      Object.defineProperty(Notification, 'permission', {
        get: () => 'default',
        configurable: true,
      });
    } catch (_) {}

    // ── 11. window outer dimensions ────────────────────────────────────────
    // Headless: outerWidth/Height = 0. Real Chrome = inner + chrome chrome.
    Object.defineProperty(window, 'outerWidth',  { get: () => window.innerWidth,        configurable: true });
    Object.defineProperty(window, 'outerHeight', { get: () => window.innerHeight + 73,  configurable: true });

    // ── 12. screen ─────────────────────────────────────────────────────────
    try {
      Object.defineProperty(screen, 'colorDepth',  { get: () => 24, configurable: true });
      Object.defineProperty(screen, 'pixelDepth',  { get: () => 24, configurable: true });
    } catch (_) {}

    // ── 13. WebGL vendor / renderer ────────────────────────────────────────
    // Headless reports SwiftShader or llvmpipe — bot-listed GPU strings.
    // Spoof to common Intel integrated graphics.
    try {
      const getParam = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (param: number) {
        if (param === 37445) return 'Intel Inc.';                  // UNMASKED_VENDOR_WEBGL
        if (param === 37446) return 'Intel Iris OpenGL Engine';    // UNMASKED_RENDERER_WEBGL
        return getParam.call(this, param);
      };
      const getParam2 = WebGL2RenderingContext.prototype.getParameter;
      WebGL2RenderingContext.prototype.getParameter = function (param: number) {
        if (param === 37445) return 'Intel Inc.';
        if (param === 37446) return 'Intel Iris OpenGL Engine';
        return getParam2.call(this, param);
      };
    } catch (_) {}

    // ── 14. toString fingerprint ───────────────────────────────────────────
    // Some detectors check if overridden functions still toString() as native.
    // Wrap Function.prototype.toString to return "[native code]" for patched fns.
    const origToString = Function.prototype.toString;
    const nativeLike = new Set<Function>();
    // Mark previously patched things as native-like (best effort)
    nativeLike.add(navigator.permissions?.query);
    Function.prototype.toString = function () {
      if (nativeLike.has(this)) return `function ${this.name}() { [native code] }`;
      return origToString.call(this);
    };
  });
}
