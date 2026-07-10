// In-session (and across-reload, via localStorage) gallery of finished
// prints. Note: localStorage tops out around 5-10MB depending on browser,
// so this keeps a capped number of entries and warns before evicting the
// oldest non-favorited one — plenty for a booth session, not meant as
// permanent cloud storage.

const STORAGE_KEY = 'lumiereBoothGalleryV1';
const MAX_ENTRIES = 40;

export class Gallery {
  constructor() {
    this.entries = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch (e) {
      // storage full — drop oldest non-favorite and retry once
      const idx = this.entries.findIndex(e2 => !e2.favorite);
      if (idx >= 0) { this.entries.splice(idx, 1); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries)); } catch (_) {} }
    }
  }

  add(dataUrl, meta = {}) {
    const entry = {
      id: 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      dataUrl,
      favorite: false,
      createdAt: Date.now(),
      template: meta.template || null,
      filter: meta.filter || null,
    };
    this.entries.unshift(entry);
    while (this.entries.length > MAX_ENTRIES) {
      const idx = [...this.entries].reverse().findIndex(e => !e.favorite);
      if (idx === -1) { this.entries.pop(); break; }
      this.entries.splice(this.entries.length - 1 - idx, 1);
    }
    this._save();
    return entry;
  }

  remove(id) { this.entries = this.entries.filter(e => e.id !== id); this._save(); }

  duplicate(id) {
    const e = this.entries.find(x => x.id === id);
    if (!e) return null;
    return this.add(e.dataUrl, { template: e.template, filter: e.filter });
  }

  toggleFavorite(id) {
    const e = this.entries.find(x => x.id === id);
    if (e) { e.favorite = !e.favorite; this._save(); }
    return e;
  }

  all() { return this.entries; }
  favorites() { return this.entries.filter(e => e.favorite); }
  clear() { this.entries = []; this._save(); }
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.download = filename; a.href = dataUrl;
  document.body.appendChild(a); a.click(); a.remove();
}

/** Requires window.JSZip (loaded via CDN in index.html). */
export async function downloadAsZip(entries, zipName = 'lumiere-booth-photos.zip') {
  // eslint-disable-next-line no-undef
  const zip = new JSZip();
  entries.forEach((e, i) => {
    const base64 = e.dataUrl.split(',')[1];
    zip.file(`lumiere-${i + 1}-${e.id}.png`, base64, { base64: true });
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = zipName;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
