import { useState, useEffect, useRef } from 'react';
import { applyAspectRatio, AspectRatioOption } from '../shared/ImageUpload';
import { uploadFileToServer, validateFile } from '@/lib/uploadService';

interface MediaItem {
  id: string;
  url: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  ratio?: string;
  module?: string;
  title?: string;
  altText?: string;
  caption?: string;
  enabled: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const GOLD = '#d4af37';

const RATIO_OPTIONS = [
  { value: 'Original', label: 'Original', dims: 'Original Dimensions' },
  { value: '1:1', label: '1:1 (Square)', dims: 'Rec: 1080 × 1080 px' },
  { value: '4:3', label: '4:3 (Standard)', dims: 'Rec: 1200 × 900 px' },
  { value: '16:9', label: '16:9 (Widescreen)', dims: 'Rec: 1920 × 1080 px' },
  { value: '3:2', label: '3:2 (Classic)', dims: 'Rec: 1200 × 800 px' },
  { value: '9:16', label: '9:16 (Portrait/Story)', dims: 'Rec: 1080 × 1920 px' },
];

const MODULE_OPTIONS = [
  'General', 'Hero', 'Gallery', 'Blog/News', 'Events', 'Tournaments', 'Team', 'Players', 'Ads', 'Facilities', 'Shop', 'Admin'
];

export default function AdminMediaManager() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & selection
  const [filterModule, setFilterModule] = useState('All');
  const [search, setSearch] = useState('');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<MediaItem | null>(null);

  // Upload state
  const [selectedRatio, setSelectedRatio] = useState('Original');
  const [selectedModule, setSelectedModule] = useState('General');
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeader = (): Record<string, string> => {
    const token = '' || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + '/api/media', { credentials: "include",
        headers: { ...getAuthHeader() },
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setItems(data.media || []);
      } else {
        setError(data.error || 'Failed to fetch media records');
      }
    } catch (err: any) {
      setError('Network error fetching media library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const formatRatioKey = (r: string): AspectRatioOption => {
    if (r === '1:1') return '1:1';
    if (r === '4:3') return '4:3';
    if (r === '16:9') return '16:9';
    if (r === '3:2') return '3:2';
    if (r === '9:16') return '9:16';
    return 'original';
  };

  // Handle batch file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    const queueItems: UploadQueueItem[] = files.map(file => {
      // Client-side validation
      let err: string | undefined;
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowed.includes(file.type)) {
        err = 'Unsupported format (JPEG, PNG, GIF, WEBP, SVG only)';
      } else if (file.size > 20 * 1024 * 1024) {
        err = 'File size exceeds 20MB limit';
      }

      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        progress: 0,
        status: err ? 'error' : 'pending',
        errorMessage: err,
      };
    });

    setUploadQueue(prev => [...prev, ...queueItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Start batch upload processing
  const processBatchUpload = async () => {
    const pendingItems = uploadQueue.filter(q => q.status === 'pending');
    if (pendingItems.length === 0) return;

    setIsUploading(true);

    // Update status of all pending items to uploading
    setUploadQueue(prev => prev.map(i => i.status === 'pending' ? { ...i, status: 'uploading', progress: 20 } : i));

    const ratioKey = formatRatioKey(selectedRatio);

    // Process file ratio cropping in parallel
    const preparedItems = await Promise.all(
      pendingItems.map(async (qItem) => {
        let fileToUpload: File = qItem.file;
        if (ratioKey !== 'original') {
          try {
            const dataUrl = await new Promise<string>((res, rej) => {
              const reader = new FileReader();
              reader.onload = ev => res(ev.target?.result as string);
              reader.onerror = () => rej(new Error('Failed to read file'));
              reader.readAsDataURL(qItem.file);
            });

            const croppedDataUrl = await applyAspectRatio(dataUrl, ratioKey);
            if (croppedDataUrl.startsWith('data:')) {
              const arr = croppedDataUrl.split(',');
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) u8arr[n] = bstr.charCodeAt(n);
              const blob = new Blob([u8arr], { type: 'image/png' });
              fileToUpload = new File([blob], qItem.file.name.replace(/\.[^/.]+$/, '.png'), { type: 'image/png' });
            }
          } catch (cropErr) {
            console.warn('Client ratio crop error, fallback to original:', cropErr);
          }
        }
        return { queueId: qItem.id, originalName: qItem.file.name, fileToUpload };
      })
    );

    setUploadQueue(prev => prev.map(i => i.status === 'uploading' ? { ...i, progress: 60 } : i));

    const formData = new FormData();
    preparedItems.forEach(p => {
      formData.append('images', p.fileToUpload);
    });
    formData.append('ratio', selectedRatio);
    formData.append('module', selectedModule);

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + '/api/media/batch', { credentials: "include",
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.ok && Array.isArray(data.results)) {
        // Map results back to queue items
        const resultsMap = new Map<string, { success: boolean; error?: string }>();
        data.results.forEach((r: any) => {
          resultsMap.set(r.originalName, { success: r.success, error: r.error });
        });

        setUploadQueue(prev => prev.map(i => {
          if (i.status !== 'uploading') return i;
          const match = preparedItems.find(p => p.queueId === i.id);
          const resInfo = match ? resultsMap.get(match.fileToUpload.name) || resultsMap.get(match.originalName) : undefined;

          if (resInfo && resInfo.success) {
            return { ...i, status: 'success', progress: 100 };
          } else if (resInfo) {
            return { ...i, status: 'error', progress: 0, errorMessage: resInfo.error || 'Upload failed' };
          } else {
            return { ...i, status: 'success', progress: 100 };
          }
        }));
      } else {
        const errMsg = data.error || 'Batch upload failed';
        setUploadQueue(prev => prev.map(i => i.status === 'uploading' ? { ...i, status: 'error', progress: 0, errorMessage: errMsg } : i));
      }
    } catch (err: any) {
      setUploadQueue(prev => prev.map(i => i.status === 'uploading' ? { ...i, status: 'error', progress: 0, errorMessage: 'Network upload error' } : i));
    }

    setIsUploading(false);
    fetchMedia();
  };

  // Safe 2-phase image replacement
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!replaceTarget || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const validation = validateFile(file, { maxSizeMB: 20 });
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      await uploadFileToServer(file, {
        endpoint: `/api/media/replace/${replaceTarget.id}`,
      });
      alert('Image replaced successfully.');
      setReplaceTarget(null);
      fetchMedia();
    } catch (err: any) {
      alert(`Replacement failed: ${err.message || 'Unknown error'}. Original image preserved.`);
    } finally {
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  // Update item metadata
  const handleSaveEdit = async () => {
    if (!editItem) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/media/${editItem.id}`, { credentials: "include",
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          title: editItem.title,
          altText: editItem.altText,
          caption: editItem.caption,
          ratio: editItem.ratio,
          module: editItem.module,
          enabled: editItem.enabled,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setEditItem(null);
        fetchMedia();
      } else {
        alert(`Update failed: ${data.error || 'Server error'}`);
      }
    } catch {
      alert('Network error updating image metadata');
    }
  };

  // Safe Delete
  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title || item.filename}"? This operation cannot be undone.`)) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/media/${item.id}`, { credentials: "include",
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        fetchMedia();
      } else {
        alert(`Delete failed: ${data.error || 'Server error'}`);
      }
    } catch {
      alert('Network error deleting image');
    }
  };

  // Reorder move up / down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...filteredItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const orderPayload = newItems.map((item, idx) => ({
      id: item.id,
      position: idx,
    }));

    setItems(newItems);

    try {
      await fetch((import.meta.env.VITE_API_URL || "") + '/api/media/reorder', { credentials: "include",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ order: orderPayload }),
      });
    } catch {
      console.error('Failed to persist reorder');
    }
  };

  // Filter items
  const modulesList = ['All', ...MODULE_OPTIONS];
  const filteredItems = items.filter(item => {
    const matchesMod = filterModule === 'All' || item.module === filterModule;
    const matchesSearch = !search ||
      (item.title && item.title.toLowerCase().includes(search.toLowerCase())) ||
      (item.altText && item.altText.toLowerCase().includes(search.toLowerCase())) ||
      (item.filename && item.filename.toLowerCase().includes(search.toLowerCase()));
    return matchesMod && matchesSearch;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        type="file"
        ref={replaceInputRef}
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleReplaceFile}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🖼️</span>
            <h2 className="text-2xl font-black text-white tracking-wider">SUPER ADMIN MEDIA LIBRARY</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              Super Admin Restricted
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Global production image management system with persistent storage, ratio enforcement, batch processing, and website sync.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase text-black transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)`, boxShadow: '0 0 20px rgba(212,175,55,0.3)' }}
        >
          <span>📤</span> Upload Images
        </button>
      </div>

      {/* Upload Controls & Queue Panel */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>⚙️</span> Upload Config & Batch Queue
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Target Ratio Requirement</label>
            <select
              value={selectedRatio}
              onChange={e => setSelectedRatio(e.target.value)}
              className="w-full bg-[#0d0d12] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-yellow-500/50"
            >
              {RATIO_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label} — {r.dims}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Target Module/Location</label>
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="w-full bg-[#0d0d12] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-yellow-500/50"
            >
              {MODULE_OPTIONS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Queue List */}
        {uploadQueue.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">
                Batch Queue ({uploadQueue.length} files)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={processBatchUpload}
                  disabled={isUploading || uploadQueue.every(q => q.status !== 'pending')}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-black hover:bg-green-400 disabled:opacity-40 transition-all"
                >
                  {isUploading ? 'Uploading Batch…' : 'Start Batch Upload'}
                </button>
                <button
                  onClick={() => setUploadQueue([])}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white border border-white/10"
                >
                  Clear Queue
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {uploadQueue.map(q => (
                <div key={q.id} className="bg-white/5 border border-white/8 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                  <div className="truncate flex-1">
                    <p className="text-white font-medium truncate">{q.file.name}</p>
                    <p className="text-[10px] text-gray-400">{formatSize(q.file.size)}</p>
                  </div>

                  <div className="w-32">
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${q.status === 'success' ? 'bg-green-400' : q.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}
                        style={{ width: `${q.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="w-24 text-right">
                    {q.status === 'pending' && <span className="text-gray-400 font-semibold">Pending</span>}
                    {q.status === 'uploading' && <span className="text-yellow-400 font-bold animate-pulse">Uploading…</span>}
                    {q.status === 'success' && <span className="text-green-400 font-bold">✓ Uploaded</span>}
                    {q.status === 'error' && (
                      <span className="text-red-400 font-bold truncate block" title={q.errorMessage}>
                        ✕ {q.errorMessage || 'Failed'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {modulesList.map(mod => (
            <button
              key={mod}
              onClick={() => setFilterModule(mod)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterModule === mod
                  ? 'bg-yellow-500 text-black shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by title, alt text, filename..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64 bg-[#0d0d12] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-yellow-500/50"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-4 rounded-xl text-xs flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchMedia} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400 font-semibold">Loading production media library...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white/2 rounded-2xl border border-white/5">
          <p className="text-4xl mb-2">🖼️</p>
          <p className="text-white font-bold text-sm">No media records found</p>
          <p className="text-gray-500 text-xs mt-1">Upload an image to start populating your global media storage.</p>
        </div>
      ) : (
        /* Image Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={`group bg-white/3 border rounded-2xl overflow-hidden transition-all duration-200 hover:border-yellow-500/50 flex flex-col ${
                item.enabled ? 'border-white/10' : 'border-red-500/30 opacity-60'
              }`}
            >
              {/* Image Thumbnail Preview */}
              <div className="relative aspect-video bg-black/40 overflow-hidden flex items-center justify-center">
                <img
                  src={item.url}
                  alt={item.altText || item.title || 'Media item'}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/80 text-white backdrop-blur-sm border border-white/10">
                    {item.ratio || 'Original'}
                  </span>
                  {!item.enabled && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600/90 text-white">
                      DISABLED
                    </span>
                  )}
                </div>

                {/* Quick Action Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/40 text-xs font-bold"
                    title="Preview"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => setEditItem(item)}
                    className="p-2 rounded-xl bg-yellow-500 text-black hover:bg-yellow-400 text-xs font-bold"
                    title="Edit Metadata"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      setReplaceTarget(item);
                      replaceInputRef.current?.click();
                    }}
                    className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-400 text-xs font-bold"
                    title="Replace Image"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-500 text-xs font-bold"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Card Meta Info */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-white text-xs font-bold truncate" title={item.title}>
                    {item.title || item.filename}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {item.module || 'General'} · {formatSize(item.size)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === filteredItems.length - 1}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300"
                    >
                      ▼
                    </button>
                  </div>

                  <span className="text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Full Preview */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f15] border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm">Image Preview & Details</h3>
              <button onClick={() => setPreviewItem(null)} className="text-gray-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/10">
              <img src={previewItem.url} alt={previewItem.altText || previewItem.title} className="max-h-full max-w-full object-contain" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-gray-300 bg-white/3 p-4 rounded-xl border border-white/5">
              <div><strong className="text-white">Title:</strong> {previewItem.title || 'N/A'}</div>
              <div><strong className="text-white">Ratio:</strong> {previewItem.ratio || 'Original'}</div>
              <div><strong className="text-white">Alt Text:</strong> {previewItem.altText || 'None'}</div>
              <div><strong className="text-white">Module:</strong> {previewItem.module || 'General'}</div>
              <div><strong className="text-white">File Size:</strong> {formatSize(previewItem.size)}</div>
              <div><strong className="text-white">MIME Type:</strong> {previewItem.mimeType}</div>
              <div className="col-span-2"><strong className="text-white">URL:</strong> <span className="font-mono text-[10px] text-yellow-400 select-all">{previewItem.url}</span></div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setPreviewItem(null)} className="px-5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Metadata */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f15] border border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm">Edit Image Metadata</h3>
              <button onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={editItem.title || ''}
                  onChange={e => setEditItem({ ...editItem, title: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Alt Text (Accessibility)</label>
                <input
                  type="text"
                  value={editItem.altText || ''}
                  onChange={e => setEditItem({ ...editItem, altText: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Caption (Optional)</label>
                <textarea
                  value={editItem.caption || ''}
                  onChange={e => setEditItem({ ...editItem, caption: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0a0a0f] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Ratio Tag</label>
                  <select
                    value={editItem.ratio || 'Original'}
                    onChange={e => setEditItem({ ...editItem, ratio: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    {RATIO_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Module Tag</label>
                  <select
                    value={editItem.module || 'General'}
                    onChange={e => setEditItem({ ...editItem, module: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    {MODULE_OPTIONS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="enabledCheck"
                  checked={editItem.enabled}
                  onChange={e => setEditItem({ ...editItem, enabled: e.target.checked })}
                  className="accent-yellow-500 rounded"
                />
                <label htmlFor="enabledCheck" className="text-gray-300 font-semibold cursor-pointer">
                  Image Enabled (Visible on Public Website)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-xs hover:text-white">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="px-5 py-2 rounded-xl bg-yellow-500 text-black font-bold text-xs hover:bg-yellow-400">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
