import { vi } from "vitest";

const mockQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  limit: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  then: vi.fn((callback: (value: { data: null; error: null }) => void) =>
    Promise.resolve(callback({ data: null, error: null }))
  ),
});

const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  from: vi.fn(() => mockQueryBuilder()),
  rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockResolvedValue({ error: null }),
    unsubscribe: vi.fn(),
  })),
};

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock("@/lib/actions/core", () => ({
  getSupabaseServerClient: vi.fn().mockResolvedValue(mockSupabaseClient),
}));
