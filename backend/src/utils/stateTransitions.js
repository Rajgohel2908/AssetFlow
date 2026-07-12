// ─── Asset Status State Machine ───────────────────────────────────────────────
//
// BUSINESS RULE 3: Asset status transitions must go through this allowed-transitions
// map — no direct field overwrite anywhere else in the codebase.
//
// Back-story on each transition:
//   AVAILABLE       → ALLOCATED           (allocation created)
//   AVAILABLE       → UNDER_MAINTENANCE   (maintenance approved directly from available)
//   AVAILABLE       → RETIRED             (admin retires an asset)
//   ALLOCATED       → AVAILABLE           (return processed)
//   ALLOCATED       → UNDER_MAINTENANCE   (maintenance approved while allocated)
//   ALLOCATED       → LOST               (reported lost)
//   UNDER_MAINTENANCE → AVAILABLE         (maintenance resolved)
//   UNDER_MAINTENANCE → DISPOSED          (disposed after irreparable damage)
//   RETIRED         → DISPOSED            (formal disposal of retired asset)
//   LOST            → (terminal)
//   DISPOSED        → (terminal)

export const ALLOWED_TRANSITIONS = {
  AVAILABLE: ['ALLOCATED', 'UNDER_MAINTENANCE', 'RETIRED'],
  ALLOCATED: ['AVAILABLE', 'UNDER_MAINTENANCE', 'LOST'],
  UNDER_MAINTENANCE: ['AVAILABLE', 'DISPOSED'],
  RETIRED: ['DISPOSED'],
  LOST: [],
  DISPOSED: [],
};

/**
 * Check whether a status transition is allowed.
 * @param {string} from - Current AssetStatus
 * @param {string} to   - Target AssetStatus
 * @returns {boolean}
 */
export const canTransition = (from, to) => {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
};

/**
 * Get the human-readable list of allowed next statuses for a given status.
 * @param {string} status - Current AssetStatus
 * @returns {string[]}
 */
export const getAllowedNext = (status) => {
  return ALLOWED_TRANSITIONS[status] ?? [];
};

/**
 * Assert that a transition is valid, throwing a descriptive error if not.
 * @param {string} from
 * @param {string} to
 * @throws {Error}
 */
export const assertTransition = (from, to) => {
  if (!canTransition(from, to)) {
    const allowed = getAllowedNext(from);
    const allowedStr = allowed.length ? allowed.join(', ') : 'none (terminal state)';
    throw Object.assign(
      new Error(`Cannot transition asset from ${from} to ${to}. Allowed: ${allowedStr}`),
      { statusCode: 422 }
    );
  }
};
