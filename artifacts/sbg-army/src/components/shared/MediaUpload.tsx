import { getImageUrl } from '@/lib/imageResolver';
import { Image } from './Image';
/**
 * MediaUpload — Premium image upload component with:
 * - File picker with preview
 * - Auto background removal (Canvas flood-fill, works for logos/solid-bg images)
 * - Server upload (stores file, returns URL)
 * - Tolerance slider for bg removal
 * - Drag & drop support
 */
import { useRef, useState, useCallback } from 'react';
import { removeBackground, uploadImageToServer } from '@/lib/bgRemove';
import { applyAspectRatio, AspectRatioOption } from './ImageUpload';
import ImageRatioControl from './ImageRatioControl';

interface Props {
  imageUrl: string;
  onImageChange: (url: string) => void;
  label?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'square' | 'circle' | 'wide';
  showBgRemove?: boolean;   // show "Remove Background" toggle
  showRatioControls?: boolean;
  useServerUpload?: boolean; // upload to /api/upload instead of embedding base64
  accept?: string;
  className?: string;
}

const GOLD = '#d4af37';



const sizeMap = {
  sm:   { box: 'w-16 h-16',  text: 'text-[10px]' },
  md:   { box: 'w-24 h-24',  text: 'text-xs' },
  lg:   { box: 'w-32 h-32',  text: 'text-xs' },
  xl:   { box: 'w-44 h-44',  text: 'text-sm' },
};

export default function MediaUpload({
  imageUrl, onImageChange, label, hint, size = 'lg', shape = 'square',
  showBgRemove = true, showRatioControls = true, useServerUpload = true, accept = 'image/*', className = '',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState<'idle' | 'reading' | 'removing' | 'uploading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [bgRemove, setBgRemove] = useState(false);
  const [tolerance, setTolerance] = useState(35);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioOption>('original');
  const [dragging, setDragging] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'wide' ? 'rounded-xl w-full h-32' : 'rounded-2xl';
  const { box, text } = sizeMap[size];

  const processFile = useCallback(async (file: File, ratio = selectedRatio) => {
    setError('');
    setProcessing('reading');
    setProgressMsg('Reading file…');

    try {
      // Read as DataURL
      const dataUrl = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = e => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      let result = await applyAspectRatio(dataUrl, ratio);

      // Background removal
      if (bgRemove) {
        setProcessing('removing');
        setProgressMsg('Removing background…');
        result = await removeBackground(result, tolerance);
      }

      // Server upload
      if (useServerUpload) {
        setProcessing('uploading');
        setProgressMsg('Uploading to server…');
        try {
          const url = await uploadImageToServer(result, file.name.replace(/\.[^.]+$/, '.png'));
          result = url;
        } catch (serverErr: any) {
          console.warn('Server image upload failed, falling back to local image:', serverErr);
        }
      }

      onImageChange(result);
      setProcessing('done');
      setProgressMsg('Done!');
      setTimeout(() => { setProcessing('idle'); setProgressMsg(''); }, 1500);
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
      setProcessing('error');
      setTimeout(() => { setProcessing('idle'); setError(''); }, 4000);
    }
  }, [bgRemove, tolerance, useServerUpload, selectedRatio, onImageChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) processFile(file);
  };

  const busy = processing === 'reading' || processing === 'removing' || processing === 'uploading';

  const imgPreview = imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('/') || imageUrl.startsWith('http'));

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {label && (
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
      )}

      {/* Drop zone + preview */}
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          ${shape === 'wide' ? 'w-full h-32' : box}
          ${shapeClass}
          relative flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-300
          ${dragging ? 'scale-105' : ''}
          ${busy ? 'cursor-wait' : ''}
        `}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: `2px dashed ${dragging ? GOLD : 'rgba(255,255,255,0.12)'}`,
          boxShadow: dragging ? `0 0 20px ${GOLD}40` : 'none',
        }}
      >
        {imgPreview ? (
          <>
            <Image
              src={imageUrl}
              alt="Preview"
              objectFit="contain"
              className="w-full h-full object-contain p-1"
            />
            {/* Hover overlay */}
            {!busy && (
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 rounded-[inherit]"
                style={{ background: 'rgba(0,0,0,0.65)' }}>
                <span className="text-lg">📷</span>
                <span className={`font-black text-white uppercase tracking-wider ${text}`}>Change</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-3">
            {busy ? (
              <>
                <div className="w-8 h-8 rounded-full animate-spin"
                  style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
                <span className={`text-center text-gray-400 ${text}`}>{progressMsg}</span>
              </>
            ) : (
              <>
                <div className="text-2xl">🖼️</div>
                <span className={`text-center text-gray-500 ${text}`}>
                  {dragging ? 'Drop to upload' : 'Click or drag'}
                </span>
              </>
            )}
          </div>
        )}

        {/* Processing overlay on existing image */}
        {imgPreview && busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[inherit]"
            style={{ background: 'rgba(0,0,0,0.80)' }}>
            <div className="w-8 h-8 rounded-full animate-spin"
              style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
            <span className={`text-center text-gray-300 font-bold ${text}`}>{progressMsg}</span>
          </div>
        )}
      </div>

      {/* Aspect Ratio Controls */}
      {showRatioControls && (
        <ImageRatioControl value={selectedRatio} onChange={setSelectedRatio} />
      )}

      {/* Controls row */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}
        >
          {busy ? progressMsg : imageUrl ? '🔄 Replace' : '⬆ Upload'}
        </button>

        {imageUrl && !busy && (
          <button
            type="button"
            onClick={() => onImageChange('')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all"
          >
            Remove
          </button>
        )}
      </div>

      {/* Background removal toggle */}
      {showBgRemove && (
        <div className="rounded-xl p-3 space-y-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <label className="flex items-center justify-between cursor-pointer" onClick={() => setBgRemove(b => !b)}>
            <div className="flex items-center gap-2">
              <span className="text-base">✂️</span>
              <div>
                <p className="text-xs font-black text-white">Auto Remove Background</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Best for logos with solid/white background</p>
              </div>
            </div>
            <div className={`relative w-10 h-5 rounded-full transition-all ${bgRemove ? 'bg-yellow-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${bgRemove ? 'left-5' : 'left-0.5'}`} />
            </div>
          </label>

          {bgRemove && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Sensitivity: <span className="text-yellow-400 font-bold">{tolerance}</span></span>
                <span className="text-[10px] text-gray-600">Higher = more removed</span>
              </div>
              <input
                type="range" min={10} max={80} step={5} value={tolerance}
                onChange={e => setTolerance(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-yellow-500"
                style={{ accentColor: GOLD }}
              />
              <div className="flex justify-between text-[9px] text-gray-600">
                <span>Precise (10)</span>
                <span>Aggressive (80)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {(error || processing === 'error') && (
        <p className="text-xs text-red-400 font-bold">⚠ {error || 'Upload failed'}</p>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="text-[10px] text-gray-600">{hint}</p>
      )}

      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  );
}
