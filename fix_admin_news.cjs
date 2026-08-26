const fs = require('fs');

let content = fs.readFileSync('artifacts/sbg-army/src/components/admin/AdminNews.tsx', 'utf8');

if (!content.includes('ImageUpload')) {
  content = "import ImageUpload from '@/components/shared/ImageUpload';\n" + content;
  content = content.replace(/const handleThumbUpload = [\s\S]*?reader\.readAsDataURL\(file\);\s*\};/, '');
  content = content.replace(/<div className="flex items-center gap-4 mt-1">[\s\S]*?<\/div>/, '<ImageUpload value={form.thumbnail} onChange={url => setForm(f => ({ ...f, thumbnail: url }))} label="" size="lg" shape="square" showRatioControls={true} />');
  fs.writeFileSync('artifacts/sbg-army/src/components/admin/AdminNews.tsx', content);
}

