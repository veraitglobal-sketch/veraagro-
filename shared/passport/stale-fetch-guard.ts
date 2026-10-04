/** Guards async passport loads so stale responses cannot overwrite newer ones. */

export interface PassportLoadState<TData> {
  loading: boolean;
  data: TData | null;
  error: string | null;
  loadedFor: string | null;
}

export function createPassportLoader<TData>(
  fetchImpl: (batchId: string, badgeSerial?: string | null) => Promise<TData>,
) {
  let seq = 0;
  let state: PassportLoadState<TData> = {
    loading: false,
    data: null,
    error: null,
    loadedFor: null,
  };

  async function load(batchId: string, badgeSerial?: string | null): Promise<PassportLoadState<TData>> {
    const mySeq = ++seq;
    state = { loading: true, data: null, error: null, loadedFor: null };
    try {
      const data = await fetchImpl(batchId, badgeSerial);
      if (mySeq !== seq) return state;
      state = { loading: false, data, error: null, loadedFor: batchId };
    } catch (err: unknown) {
      if (mySeq !== seq) return state;
      state = {
        loading: false,
        data: null,
        error: err instanceof Error ? err.message : String(err),
        loadedFor: null,
      };
    } finally {
      if (mySeq === seq && state.loading) state = { ...state, loading: false };
    }
    return state;
  }

  function invalidate(): void {
    seq += 1;
  }

  return { load, invalidate, getState: () => state };
}

/** Lightweight seq guard for React components that manage their own state. */
export class PassportRequestGuard {
  private seq = 0;

  begin(): number {
    return ++this.seq;
  }

  isLatest(mySeq: number): boolean {
    return mySeq === this.seq;
  }

  invalidate(): void {
    this.seq += 1;
  }
}
