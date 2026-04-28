# Security Specification for GhostMark AI

## 1. Data Invariants
- A Prospect must have a unique URL.
- A Prospect's `ownerId` must match the authenticated user's ID.
- `status` can only transition through the defined lifecycle (pending -> enriched -> analyzed -> validated -> sent).
- Only Admins or the Owner can read/write their prospects.
- `opportunityLoss` must be a positive number.

## 2. The "Dirty Dozen" Payloads
1. Create a prospect with someone else's `ownerId`.
2. Update a prospect's `opportunityLoss` to a negative number.
3. Inject a 1MB string into the `url` field.
4. Transition `status` from `pending` directly to `sent` without validation.
5. Create a prospect with an invalid URL format.
6. Try to read all prospects without being an owner (missing `where` clause).
7. Attempt to delete a prospect owned by another user.
8. Update `visualHookUrl` with a non-URL string.
9. Create a user profile with `isAdmin: true` as a regular user.
10. Update a prospect after it has been marked as `sent` (terminal state).
11. Inject malicious document IDs (e.g. scripts or long strings).
12. Modify `createdAt` after document creation.

## 3. Test Runner (Draft Rules)
The draft rules will ensure all above payloads are blocked.
