import { searchBookPages } from './searchEngine';
import {
  BookBookmark,
  BookDepartmentTag,
  BookHighlightNote,
  BookPageText,
  CrossBookSearchResult,
  LibraryBookMeta,
  StorageSummary
} from './types';

const DB_NAME = 'pharmlab_knowledge_library';
const DB_VERSION = 2;

const STORE_BOOKS = 'books';
const STORE_FILES = 'files';
const STORE_PAGES = 'pages';
const STORE_BOOKMARKS = 'bookmarks';
const STORE_NOTES = 'notes';

let dbPromise: Promise<IDBDatabase> | null = null;

function openLibraryDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        const booksStore = db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
        booksStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'bookId' });
      }

      if (!db.objectStoreNames.contains(STORE_PAGES)) {
        const pagesStore = db.createObjectStore(STORE_PAGES, {
          keyPath: ['bookId', 'pageNumber']
        });
        pagesStore.createIndex('byBookId', 'bookId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_BOOKMARKS)) {
        const bookmarksStore = db.createObjectStore(STORE_BOOKMARKS, {
          keyPath: 'id'
        });
        bookmarksStore.createIndex('byBookId', 'bookId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        const notesStore = db.createObjectStore(STORE_NOTES, {
          keyPath: 'id'
        });
        notesStore.createIndex('byBookId', 'bookId', { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open Knowledge Library database.'));
    };
  });

  return dbPromise;
}

function wrapRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function wrapTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}

export async function getAllBooks(): Promise<LibraryBookMeta[]> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORE_BOOKS, 'readonly');
  const store = tx.objectStore(STORE_BOOKS);
  const books = await wrapRequest(store.getAll() as IDBRequest<LibraryBookMeta[]>);
  return books.sort((a, b) => (b.lastOpenedAt || b.uploadedAt) - (a.lastOpenedAt || a.uploadedAt));
}

export async function saveBookPackage(
  meta: LibraryBookMeta,
  fileBuffer: ArrayBuffer,
  pages: BookPageText[]
): Promise<void> {
  const db = await openLibraryDb();
  const tx = db.transaction([STORE_BOOKS, STORE_FILES, STORE_PAGES], 'readwrite');

  tx.objectStore(STORE_BOOKS).put(meta);
  tx.objectStore(STORE_FILES).put({ bookId: meta.id, data: fileBuffer });

  const pagesStore = tx.objectStore(STORE_PAGES);
  for (const page of pages) {
    pagesStore.put(page);
  }

  try {
    await wrapTransaction(tx);
  } catch (err) {
    const record = err as { name?: string };
    if (record?.name === 'QuotaExceededError') {
      const quotaErr = new Error(
        'Browser storage quota exceeded while saving this PDF. Delete unused books and try again.'
      );
      quotaErr.name = 'QuotaExceededError';
      throw quotaErr;
    }
    throw err;
  }
}

export async function getBookFile(bookId: string): Promise<ArrayBuffer | null> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORE_FILES, 'readonly');
  const record = await wrapRequest(
    tx.objectStore(STORE_FILES).get(bookId) as IDBRequest<{ bookId: string; data: ArrayBuffer } | undefined>
  );
  return record?.data ?? null;
}

export async function getBookPages(bookId: string): Promise<BookPageText[]> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORE_PAGES, 'readonly');
  const index = tx.objectStore(STORE_PAGES).index('byBookId');
  const pages = await wrapRequest(index.getAll(IDBKeyRange.only(bookId)) as IDBRequest<BookPageText[]>);
  return pages.sort((a, b) => a.pageNumber - b.pageNumber);
}

export async function updateBookReadingProgress(
  bookId: string,
  lastReadPage: number
): Promise<void> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORE_BOOKS, 'readwrite');
  const store = tx.objectStore(STORE_BOOKS);
  const existing = await wrapRequest(store.get(bookId) as IDBRequest<LibraryBookMeta | undefined>);
  if (!existing) return;

  store.put({
    ...existing,
    lastReadPage,
    lastOpenedAt: Date.now()
  });

  await wrapTransaction(tx);
}

export async function updateBookMeta(
  bookId: string,
  patch: Partial<Pick<LibraryBookMeta, 'title' | 'category' | 'department'>>
): Promise<LibraryBookMeta | null> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORE_BOOKS, 'readwrite');
  const store = tx.objectStore(STORE_BOOKS);
  const existing = await wrapRequest(store.get(bookId) as IDBRequest<LibraryBookMeta | undefined>);
  if (!existing) return null;

  const updated: LibraryBookMeta = { ...existing, ...patch };
  store.put(updated);
  await wrapTransaction(tx);
  return updated;
}

export async function deleteBook(bookId: string): Promise<void> {
  const db = await openLibraryDb();
  const tx = db.transaction(
    [STORE_BOOKS, STORE_FILES, STORE_PAGES, STORE_BOOKMARKS, STORE_NOTES],
    'readwrite'
  );

  tx.objectStore(STORE_BOOKS).delete(bookId);
  tx.objectStore(STORE_FILES).delete(bookId);

  const deleteByIndex = (storeName: string) => {
    const store = tx.objectStore(storeName);
    const index = store.index('byBookId');
    const cursorReq = index.openKeyCursor(IDBKeyRange.only(bookId));
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
  };

  deleteByIndex(STORE_PAGES);
  deleteByIndex(STORE_BOOKMARKS);
  deleteByIndex(STORE_NOTES);

  await wrapTransaction(tx);
}

export async function getBookmarks(bookId: string): Promise<BookBookmark[]> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORE_BOOKMARKS, 'readonly');
  const index = tx.objectStore(STORE_BOOKMARKS).index('byBookId');
  const list = await wrapRequest(
    index.getAll(IDBKeyRange.only(bookId)) as IDBRequest<BookBookmark[]>
  );
  return list.sort((a, b) => a.pageNumber - b.pageNumber || a.createdAt - b.createdAt);
}

export async function addBookmark(bookmark: BookBookmark): Promise<void> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORE_BOOKMARKS, 'readwrite');
  tx.objectStore(STORE_BOOKMARKS).put(bookmark);
  await wrapTransaction(tx);
}

export async function removeBookmark(bookmarkId: string): Promise<void> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORE_BOOKMARKS, 'readwrite');
  tx.objectStore(STORE_BOOKMARKS).delete(bookmarkId);
  await wrapTransaction(tx);
}

export async function getBookNotes(bookId: string): Promise<BookHighlightNote[]> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORE_NOTES, 'readonly');
  const index = tx.objectStore(STORE_NOTES).index('byBookId');
  const list = await wrapRequest(
    index.getAll(IDBKeyRange.only(bookId)) as IDBRequest<BookHighlightNote[]>
  );
  return list.sort((a, b) => a.pageNumber - b.pageNumber || b.createdAt - a.createdAt);
}

export async function addBookNote(note: BookHighlightNote): Promise<void> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORE_NOTES, 'readwrite');
  tx.objectStore(STORE_NOTES).put(note);
  await wrapTransaction(tx);
}

export async function removeBookNote(noteId: string): Promise<void> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORE_NOTES, 'readwrite');
  tx.objectStore(STORE_NOTES).delete(noteId);
  await wrapTransaction(tx);
}

export async function searchAllBooks(
  rawQuery: string,
  department?: BookDepartmentTag,
  maxPerBook = 3
): Promise<CrossBookSearchResult[]> {
  const trimmed = rawQuery.trim();
  if (trimmed.length < 2) return [];

  const allBooks = await getAllBooks();
  const searchableBooks = allBooks.filter((b) => b.hasSearchableText);
  if (searchableBooks.length === 0) return [];

  // Prioritize books tagged with this department or untagged/all, then others
  const sortedBooks = [...searchableBooks].sort((a, b) => {
    const aMatch = !department || department === 'all' || a.department === department ? 1 : 0;
    const bMatch = !department || department === 'all' || b.department === department ? 1 : 0;
    return bMatch - aMatch;
  });

  const results: CrossBookSearchResult[] = [];
  for (const book of sortedBooks) {
    const pages = await getBookPages(book.id);
    const matches = searchBookPages(pages, trimmed, maxPerBook);
    if (matches.length > 0) {
      results.push({ book, matches });
    }
  }

  return results;
}

export async function getStorageSummary(): Promise<StorageSummary> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usageBytes: typeof estimate.usage === 'number' ? estimate.usage : null,
        quotaBytes: typeof estimate.quota === 'number' ? estimate.quota : null
      };
    }
  } catch {
    // ignore storage estimate failures
  }
  return { usageBytes: null, quotaBytes: null };
}
