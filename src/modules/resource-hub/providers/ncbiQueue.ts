let queueTail: Promise<void> = Promise.resolve();
let lastRequestAt = 0;
const MIN_GAP_MS = 380;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchNcbiText(url: string, signal?: AbortSignal): Promise<string> {
  const run = async (): Promise<string> => {
    const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastRequestAt));
    if (wait > 0) {
      await sleep(wait);
    }
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    lastRequestAt = Date.now();
    let res = await fetch(url, { signal });

    if (res.status === 429) {
      await sleep(750);
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      lastRequestAt = Date.now();
      res = await fetch(url, { signal });
    }

    if (!res.ok) {
      throw new Error(`NCBI E-utilities HTTP ${res.status}`);
    }
    return res.text();
  };

  const resultPromise = queueTail.then(run, run);
  queueTail = resultPromise.then(
    () => undefined,
    () => undefined
  );
  return resultPromise;
}

export async function fetchNcbiJson<T = unknown>(
  url: string,
  signal?: AbortSignal
): Promise<T> {
  const txt = await fetchNcbiText(url, signal);
  return JSON.parse(txt) as T;
}
