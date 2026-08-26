import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { Settings } from '@/lib/database';

interface Props {
  settings: Settings;
}

export default function MaintenanceScreen({ settings }: Props) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse at center, ${settings.primaryColor}22 0%, transparent 70%)`
        }} />
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {settings.logo ? (
          <Image src={settings.logo} alt={settings.organizationName} objectFit="contain" className="h-24 w-auto mx-auto mb-8 object-contain" />
        ) : (
          <div className="h-24 w-24 mx-auto mb-8 rounded-2xl flex items-center justify-center font-black text-3xl text-white"
            style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.accentColor})` }}>
            SBG
          </div>
        )}
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="text-4xl md:text-5xl font-black tracking-widest text-white mb-4">
          MAINTENANCE MODE
        </h1>
        <p className="text-gray-400 text-lg mb-8">{settings.maintenanceMessage}</p>
        <div className="flex gap-2 justify-center">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full animate-bounce"
              style={{ background: settings.primaryColor, animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
