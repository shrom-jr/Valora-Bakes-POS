---
name: Realtime Database transaction null pass
description: Handling Firebase Realtime Database transaction callbacks when the local cache initially has no value.
---

For transactions that must reconcile against existing server data, do not immediately abort solely because the transaction callback receives a falsy local value. Return a safe fallback object so the SDK can synchronize with the server and retry the update function against the current value. Keep sale validation and mutations inside the transaction callback, and reset any captured failure reason at the start of each callback invocation because callbacks may be retried.

**Why:** A checkout transaction against the database root was aborting at the first empty local-cache evaluation, preventing Firebase from reconciling with populated cloud data.

**How to apply:** For root-level Realtime Database transactions, initialize a fresh object and required subtrees when the callback value is absent; only perform domain updates when authoritative required records are present. Ensure a truly empty server root cannot be mistaken for a completed sale.