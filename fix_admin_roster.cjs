const fs = require('fs');

let content = fs.readFileSync('artifacts/sbg-army/src/components/admin/AdminRoster.tsx', 'utf8');

if (!content.includes('ImageUpload')) {
  content = "import ImageUpload from '@/components/shared/ImageUpload';\n" + content;
  content = content.replace(/const handleImageUpload = [\s\S]*?reader\.readAsDataURL\(file\);\s*\};\s*\};/g, '');
  // wait, the regex for removing handleImageUpload might be tricky. Let's just find the image input and replace it.
  
  content = content.replace(/<div className="flex items-center gap-4 mt-1">[\s\S]*?<input type="file" accept="image\/\*" onChange=\{handleImageUpload\} className="hidden" \/>[\s\S]*?<\/div>/g, '<ImageUpload value={form.image || ""} onChange={url => setForm(f => ({ ...f, image: url }))} label="" size="lg" shape="square" />');
  
  content = content.replace(/<label className="cursor-pointer text-xs font-bold text-orange-400 hover:text-orange-300">[\s\S]*?<input type="file" accept="image\/\*" onChange=\{\(e\) => \{[\s\S]*?reader\.readAsDataURL\(file\);\s*\}\} className="hidden" \/>\s*<\/label>[\s\S]*?(?:<\/button>\s*)\}?\s*<\/div>|<label className="cursor-pointer text-xs font-bold text-orange-400 hover:text-orange-300">[\s\S]*?<\/button>\s*\})/g, 
  '<ImageUpload value={form.kdRatioImage || ""} onChange={url => setForm(f => ({ ...f, kdRatioImage: url }))} label="Upload K/D Proof" size="sm" shape="square" />');
  
  fs.writeFileSync('artifacts/sbg-army/src/components/admin/AdminRoster.tsx', content);
}
