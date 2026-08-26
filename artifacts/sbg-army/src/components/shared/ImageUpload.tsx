import { getImageUrl } from '@/lib/imageResolver';
import { Image } from './Image';
import { useRef, useState } from 'react';
import ImageRatioControl, { AspectRatioOption, RATIO_OPTIONS } from './ImageRatioControl';
import { uploadFileToServer } from '@/lib/uploadService';

export type { AspectRatioOption };

interface Props {
  imageUrl: string;          // current image URL or data URL
  onImageChange: (url: string) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'square' | 'circle';
  accept?: string;
  className?: string;
  uploadEndpoint?: string; // if set or default '/api/upload', uploads to server and uses returned URL
  showRatioControls?: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function applyAspectRatio(
  dataUrl: string,
  ratio: AspectRatioOption
): Promise<string> {
  if (ratio === 'original' || !dataUrl.startsWith('data:')) return Promise.resolve(dataUrl);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let targetRatio = 1;
      if (ratio === '1:1') targetRatio = 1;
      else if (ratio === '4:3') targetRatio = 4 / 3;
      else if (ratio === '16:9') targetRatio = 16 / 9;
      else if (ratio === '3:2') targetRatio = 3 / 2;
      else if (ratio === '9:16') targetRatio = 9 / 16;

      const srcWidth = img.width;
      const srcHeight = img.height;
      const srcRatio = srcWidth / srcHeight;

      let drawWidth = srcWidth;
      let drawHeight = srcHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (srcRatio > targetRatio) {
        drawWidth = srcHeight * targetRatio;
        offsetX = (srcWidth - drawWidth) / 2;
      } else {
        drawHeight = srcWidth / targetRatio;
        offsetY = (srcHeight - drawHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(drawWidth);
      canvas.height = Math.round(drawHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// RATIO_OPTIONS is imported from ./ImageRatioControl

export default function ImageUpload({
  imageUrl, onImageChange, label = 'Upload Image', size = 'md', shape = 'square',
  accept = 'image/*', className = '', uploadEndpoint = '/api/upload',
  showRatioControls = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioOption>('original');
  const [rawFile, setRawFile] = useState<File | null>(null);

  const sizeMap = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-32 h-32' };
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  const processAndUpload = async (file: File, ratio: AspectRatioOption) => {
    setUploading(true);
    setError('');
    try {
      // Read file to DataURL first for ratio cropping if requested
      const dataUrl = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = ev => res(ev.target?.result as string);
        reader.onerror = () => rej(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const croppedDataUrl = await applyAspectRatio(dataUrl, ratio);

      // Convert cropped DataURL back to Blob for persistent server upload
      let fileToUpload: File = file;
      if (ratio !== 'original' && croppedDataUrl.startsWith('data:')) {
        const arr = croppedDataUrl.split(',');
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        const blob = new Blob([u8arr], { type: 'image/png' });
        fileToUpload = new File([blob], file.name.replace(/\.[^/.]+$/, '.png'), { type: 'image/png' });
      }

      if (uploadEndpoint) {
        try {
          const result = await uploadFileToServer(fileToUpload, {
            endpoint: uploadEndpoint.startsWith('/') ? uploadEndpoint : `/api/${uploadEndpoint}`,
          });
          onImageChange(result.url);
        } catch (serverErr) {
          console.warn('Server upload failed, falling back to croppedDataUrl:', serverErr);
          onImageChange(croppedDataUrl);
        }
      } else {
        onImageChange(croppedDataUrl);
      }
    } catch (err: any) {
      setError(err?.message || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawFile(file);
    await processAndUpload(file, selectedRatio);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRatioChange = async (newRatio: AspectRatioOption) => {
    setSelectedRatio(newRatio);
    if (rawFile) {
      await processAndUpload(rawFile, newRatio);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {label && (
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      )}

      {/* Preview */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`${sizeMap[size]} ${shapeClass} border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-yellow-500/50 transition-colors relative group bg-white/3`}
        title="Click to upload image"
      >
        {imageUrl ? (
          <>
            <Image src={imageUrl} alt="Preview" objectFit="cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-bold">CHANGE</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 p-2">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-2xl">📷</span>
                <span className="text-[10px] text-gray-500 text-center">Click to upload</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Aspect Ratio Selector */}
      {showRatioControls && (
        <ImageRatioControl value={selectedRatio} onChange={handleRatioChange} />
      )}

      {/* Upload button */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-yellow-500/40 text-gray-400 hover:text-white transition-all disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : imageUrl ? 'Change Image' : 'Upload Image'}
      </button>

      {/* Clear button */}
      {imageUrl && !uploading && (
        <button
          type="button"
          onClick={() => { setRawFile(null); onImageChange(''); }}
          className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
        >
          Remove
        </button>
      )}

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
