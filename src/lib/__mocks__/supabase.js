import { vi } from "vitest";

/**
 * Shared mock for the Supabase client used across all tests.
 *
 * Each test can override specific return values via
 *   supabase.from.mockReturnValue(...)
 * or by configuring the chainable query builder methods.
 */

// Chainable query builder — each method returns `this` so calls can be chained.
const queryBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  abortSignal: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  // Default: resolves to empty data
  // eslint-disable-next-line unicorn/no-thenable -- intentional: mock must be awaitable
  then: vi.fn((resolve) => resolve({ data: [], error: null })),
};

// Make the builder itself thenable so `await supabase.from(...).select(...)` works
queryBuilder[Symbol.for("then")] = queryBuilder.then;

// Override the default Promise resolution
const makeThenable = (builder) => {
  // When the builder is awaited directly, resolve with { data: [], error: null }
  // eslint-disable-next-line unicorn/no-thenable -- intentional: builder must be awaitable
  builder.then = (resolve) => resolve({ data: [], error: null });
  return builder;
};

export const supabase = {
  from: vi.fn(() => makeThenable({ ...queryBuilder })),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
};
