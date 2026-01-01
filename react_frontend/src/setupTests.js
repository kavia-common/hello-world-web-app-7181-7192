/* eslint-disable no-undef */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

/**
 * Ensure Web Crypto APIs exist in the Jest + JSDOM environment.
 *
 * Some dependencies (e.g., react-chatbotify) require:
 *   - crypto.getRandomValues
 *   - crypto.randomUUID
 *
 * JSDOM doesn't always provide these APIs, so we polyfill them using Node's
 * built-in `crypto.webcrypto` when available, and fall back to lightweight
 * implementations when not.
 */
(function ensureWebCrypto() {
  // Prefer any existing crypto (browser-like or Node 19+ global), otherwise create one.
  const g = globalThis;

  if (!g.crypto) {
    g.crypto = {};
  }

  // 1) getRandomValues polyfill
  if (typeof g.crypto.getRandomValues !== "function") {
    try {
      // eslint-disable-next-line global-require
      const nodeCrypto = require("crypto");
      if (nodeCrypto?.webcrypto?.getRandomValues) {
        g.crypto.getRandomValues = nodeCrypto.webcrypto.getRandomValues.bind(
          nodeCrypto.webcrypto
        );
      }
    } catch (e) {
      // ignore; we'll fallback below
    }
  }

  if (typeof g.crypto.getRandomValues !== "function") {
    g.crypto.getRandomValues = (typedArray) => {
      // Minimal, non-cryptographic fallback adequate for unit tests.
      for (let i = 0; i < typedArray.length; i += 1) {
        // eslint-disable-next-line no-bitwise
        typedArray[i] = (Math.random() * 256) | 0;
      }
      return typedArray;
    };
  }

  // 2) randomUUID polyfill
  if (typeof g.crypto.randomUUID !== "function") {
    try {
      // eslint-disable-next-line global-require
      const nodeCrypto = require("crypto");
      if (typeof nodeCrypto?.randomUUID === "function") {
        g.crypto.randomUUID = nodeCrypto.randomUUID.bind(nodeCrypto);
      } else if (nodeCrypto?.webcrypto?.randomUUID) {
        g.crypto.randomUUID = nodeCrypto.webcrypto.randomUUID.bind(
          nodeCrypto.webcrypto
        );
      }
    } catch (e) {
      // ignore; we'll fallback below
    }
  }

  if (typeof g.crypto.randomUUID !== "function") {
    g.crypto.randomUUID = () => {
      // RFC4122 v4-ish (not cryptographically strong, but stable for tests)
      const bytes = new Uint8Array(16);
      g.crypto.getRandomValues(bytes);
      // eslint-disable-next-line no-bitwise
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      // eslint-disable-next-line no-bitwise
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      const toHex = (n) => n.toString(16).padStart(2, "0");
      const b = Array.from(bytes, toHex).join("");

      return `${b.slice(0, 8)}-${b.slice(8, 12)}-${b.slice(12, 16)}-${b.slice(
        16,
        20
      )}-${b.slice(20)}`;
    };
  }
})();
