/**
 * NidhiSetu FDR Document Repository (IndexedDB Layer)
 * Manages storage and retrieval of binary PDF & image scans using browser IndexedDB.
 * Large document blobs are NEVER stored in localStorage.
 * Includes in-memory fallback for environments where IndexedDB is blocked or disabled.
 */

import { computeSHA256, validateDocumentFile } from './fdrValidation';

const DB_NAME = 'nidhisetu_documents_v1';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

// In-memory fallback cache if IndexedDB is unavailable
const memoryFallbackStore = new Map();

class FdrDocumentRepository {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  /**
   * Initializes the IndexedDB database
   */
  async initDB() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      if (!globalThis.indexedDB) {
        console.warn('[NidhiSetu IDB] IndexedDB not available. Using in-memory fallback.');
        return resolve(null);
      }

      try {
        const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('institutionId', 'institutionId', { unique: false });
            store.createIndex('sha256Hash', 'sha256Hash', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve(this.db);
        };

        request.onerror = (event) => {
          console.warn('[NidhiSetu IDB] Failed to open IndexedDB, falling back:', event.target.error);
          resolve(null);
        };
      } catch (err) {
        console.warn('[NidhiSetu IDB] Error initializing IndexedDB, falling back:', err);
        resolve(null);
      }
    });

    return this.initPromise;
  }

  /**
   * Stores a document file blob into IndexedDB
   */
  async saveDocument(fileOrOptions, metadata = {}) {
    let file;
    let institutionId = null;
    let fdrReference = null;
    let customFileName = null;
    let customFileType = null;

    if (fileOrOptions && (fileOrOptions instanceof Blob || fileOrOptions instanceof File || fileOrOptions.size !== undefined)) {
      file = fileOrOptions;
      institutionId = metadata.institutionId || null;
      fdrReference = metadata.fdrReference || null;
      customFileName = metadata.fileName || null;
      customFileType = metadata.fileType || null;
    } else if (fileOrOptions && typeof fileOrOptions === 'object') {
      file = fileOrOptions.file;
      institutionId = fileOrOptions.institutionId || null;
      fdrReference = fileOrOptions.fdrReference || null;
      customFileName = fileOrOptions.fileName || null;
      customFileType = fileOrOptions.fileType || null;
    }

    if (!file) {
      throw new Error('Please select a document file to attach.');
    }

    // Attach fake name if bare blob without name
    if (!file.name && customFileName) {
      file.name = customFileName;
    } else if (!file.name) {
      file.name = 'uploaded_fdr.pdf';
    }

    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const sha256Hash = metadata.sha256Hash || (await computeSHA256(file));
    const docId = `doc-${crypto.randomUUID().slice(0, 8)}`;

    const docRecord = {
      id: docId,
      fileName: file.name || customFileName || 'document.pdf',
      fileType: file.type || customFileType || 'application/pdf',
      fileSize: file.size,
      sha256Hash,
      institutionId,
      fdrReference,
      blob: file, // Store File/Blob directly in IndexedDB
      uploadedAt: new Date().toISOString(),
    };

    const db = await this.initDB();
    if (db) {
      await new Promise((resolve, reject) => {
        try {
          const tx = db.transaction([STORE_NAME], 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(docRecord);
          req.onsuccess = () => resolve(true);
          req.onerror = (e) => reject(e.target.error);
        } catch (err) {
          reject(err);
        }
      });
    } else {
      // Memory fallback
      memoryFallbackStore.set(docId, docRecord);
    }

    return {
      documentId: docId,
      id: docId,
      fileName: docRecord.fileName,
      fileType: docRecord.fileType,
      fileSize: docRecord.fileSize,
      sha256Hash: docRecord.sha256Hash,
      uploadedAt: docRecord.uploadedAt,
    };
  }

  /**
   * Retrieves a document record by ID
   */
  async getDocument(docId) {
    if (!docId) return null;

    const db = await this.initDB();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction([STORE_NAME], 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(docId);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(memoryFallbackStore.get(docId) || null);
        }
      });
    }

    return memoryFallbackStore.get(docId) || null;
  }

  /**
   * Deletes a document by ID
   */
  async deleteDocument(docId) {
    if (!docId) return false;

    memoryFallbackStore.delete(docId);

    const db = await this.initDB();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction([STORE_NAME], 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(docId);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
    }

    return true;
  }

  /**
   * Creates a browser Blob URL for viewing/previewing the document
   * Remember to call revokeDocumentUrl when done!
   */
  async createDocumentUrl(docId) {
    const doc = await this.getDocument(docId);
    if (!doc || !doc.blob) return null;
    if (typeof URL.createObjectURL === 'function') {
      try {
        const u = URL.createObjectURL(doc.blob);
        if (typeof u === 'string') return u;
      } catch (e) {
        // Fallback for node test env
      }
    }
    return `blob:nidhisetu-doc-${docId}`;
  }

  /**
   * Revokes an existing Blob URL to prevent memory leaks
   */
  revokeDocumentUrl(url) {
    if (url && typeof url === 'string' && url.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    }
  }

  /**
   * Cleans up orphaned documents not referenced by active FDR records
   */
  async cleanupOrphanDocuments(activeDocumentIds = []) {
    const activeSet = new Set(activeDocumentIds.filter(Boolean));
    const db = await this.initDB();

    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction([STORE_NAME], 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAllKeys();
          req.onsuccess = () => {
            const keys = req.result || [];
            let deleted = 0;
            for (const key of keys) {
              if (!activeSet.has(key)) {
                store.delete(key);
                deleted++;
              }
            }
            resolve(deleted);
          };
          req.onerror = () => resolve(0);
        } catch {
          resolve(0);
        }
      });
    }

    let deleted = 0;
    for (const key of memoryFallbackStore.keys()) {
      if (!activeSet.has(key)) {
        memoryFallbackStore.delete(key);
        deleted++;
      }
    }
    return deleted;
  }
}

export const fdrDocumentRepository = new FdrDocumentRepository();
