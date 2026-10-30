// The child process must not contact a provider even if a compatibility check regresses.
globalThis.fetch = async () => {
  throw new Error("External network is forbidden in the stdio fixture");
};
await import("../../src/stdio.js");
export {};
