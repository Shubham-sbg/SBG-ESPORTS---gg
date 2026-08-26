const fs = require('fs');

let content = fs.readFileSync('artifacts/sbg-army/src/components/admin/AdminRoster.tsx', 'utf8');

if (!content.includes('ImageUpload')) {
  content = "import ImageUpload from '@/components/shared/ImageUpload';\n" + content;
  
  content = content.replace(/<div className="flex items-center gap-4 mt-1">[\s\S]*?<\/label>\s*<\/div>/, '<ImageUpload value={form.image || ""} onChange={url => setForm(f => ({ ...f, image: url }))} label="" size="lg" shape="square" showRatioControls={false} />');

  content = content.replace(/<label className="cursor-pointer px-3 py-1\.5 rounded-lg bg-white\/10 text-white text-xs font-bold hover:bg-white\/20 transition">[\s\S]*?<\/div>/, '<ImageUpload value={form.kdRatioImage || ""} onChange={url => setForm(f => ({ ...f, kdRatioImage: url }))} label="Upload Proof" size="sm" shape="square" showRatioControls={false} />\n                </div>');
  
  fs.writeFileSync('artifacts/sbg-army/src/components/admin/AdminRoster.tsx', content);
}
