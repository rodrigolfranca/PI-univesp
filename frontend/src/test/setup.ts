import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

const jsdom = (globalThis as { jsdom?: { window: Window } }).jsdom;

if (jsdom) {
  Object.defineProperty(globalThis, "localStorage", {
    value: jsdom.window.localStorage,
    configurable: true,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    value: jsdom.window.sessionStorage,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
});
