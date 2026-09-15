---
name: Firebase staff trust boundary
description: The authentication and authorization assumption behind Bakery POS Phase 2 Realtime Database access.
---

Phase 2 treats every authenticated Firebase account as a trusted bakery staff account with access to register, menu management, and shelf inventory.

**Why:** No cashier/manager role model or Admin SDK credentials were provided. Safe category deletion uses an atomic root Realtime Database transaction, so authenticated root transaction permission is required while child schema validation constrains stored records.

**How to apply:** Only create accounts for trusted staff. Before allowing less-trusted users or separating cashier and manager duties, add Firebase custom claims or a trusted backend and tighten database rules accordingly.