# Security Specification - Shelter Management Dashboard

## Data Invariants
1. A **Shelter** must have a unique ID, valid name, and region.
2. A **Project** must be associated with a valid Shelter ID.
3. A **Task** must have a deadline and priority, and be linked to a target (Shelter or Partner).
4. **Inventory** entries must balance correctly (though rules cannot check this across documents, they can check types).
5. All documents MUST include a `userId` field representing the owner/creator.
6. Only authenticated users with verified emails can write.

## The Dirty Dozen Payloads

1. **Identity Theft**: Creating a shelter with a `userId` that is not the current user's.
2. **Shadow Field Injection**: Adding an `isAdmin: true` field to a user profile or document.
3. **ID Poisoning**: Injecting 2KB strings as document IDs.
4. **Relational Orphan**: Creating a task for a non-existent shelter (checked via `exists`).
5. **State Skipping**: Moving a project directly to 'Completed' from 'Upcoming' without 'Ongoing' (if states were enforced, but here we just check valid enum).
6. **Immutable field update**: Trying to change `createdAt` on a task.
7. **Type Mismatch**: Sending a string for a `balance` field (number).
8. **PII Leak**: Unauthorized user attempting to read a shelter's representative contact info (if strict PII isolation is applied).
9. **Denial of Wallet**: Infinite loop of recursive `get()` checks (rules must be optimized).
10. **Global Write**: Attempting to write to a collection without a `userId`.
11. **Spoofed Email**: Using a non-verified email to gain "Admin" status (if email-based).
12. **Blanket Query**: Requesting all documents without filtering by `userId` (rules should block if list doesn't check ownership).

## The Test Runner
A `firestore.rules.test.ts` will verify these. (Note: I cannot actually *run* the tests here easily but I will write them as a blueprint).
