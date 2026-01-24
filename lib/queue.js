export const QUEUE_KEY = "streamy:queue";
export const MAX_QUEUE = 100;

export const PLAY_CONTEXT_KEY = "streamy:playContext";
export const MAX_CONTEXT = 500;

export function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function writeQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(0, MAX_QUEUE)));
    try {
      window.dispatchEvent(new Event("streamy-queue-updated"));
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
}

// Adds id to queue (or moves it to the end) and returns updated queue.
export function touchQueue(id) {
  if (!id) return readQueue();
  const queue = readQueue();
  const next = queue.filter((x) => x !== id);
  next.push(id);
  writeQueue(next);
  return next;
}

export function getPrevNext(id) {
  const queue = readQueue();
  const index = queue.lastIndexOf(id);
  if (index === -1) {
    const nextQueue = touchQueue(id);
    const i = nextQueue.lastIndexOf(id);
    return {
      prevId: i > 0 ? nextQueue[i - 1] : null,
      nextId: i < nextQueue.length - 1 ? nextQueue[i + 1] : null,
      queue: nextQueue,
      index: i,
    };
  }

  return {
    prevId: index > 0 ? queue[index - 1] : null,
    nextId: index < queue.length - 1 ? queue[index + 1] : null,
    queue,
    index,
  };
}

export function writePlayContext(ids, source) {
  try {
    const list = Array.isArray(ids) ? ids.filter(Boolean) : [];
    if (!list.length) return;
    const unique = Array.from(new Set(list)).slice(0, MAX_CONTEXT);
    localStorage.setItem(
      PLAY_CONTEXT_KEY,
      JSON.stringify({ ids: unique, source: source || null, updatedAt: Date.now() })
    );
  } catch {
    // ignore
  }
}

export function readPlayContext() {
  try {
    const raw = localStorage.getItem(PLAY_CONTEXT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const ids = Array.isArray(parsed?.ids) ? parsed.ids.filter(Boolean) : [];
    return { ids, source: parsed?.source || null };
  } catch {
    return { ids: [], source: null };
  }
}

export function getPrevNextFromContext(id) {
  const { ids } = readPlayContext();
  const index = ids.indexOf(id);
  return {
    prevId: index > 0 ? ids[index - 1] : null,
    nextId: index >= 0 && index < ids.length - 1 ? ids[index + 1] : null,
    ids,
    index,
  };
}
