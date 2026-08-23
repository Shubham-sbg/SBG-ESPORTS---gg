import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineDetector() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 py-3 px-4 bg-red-900/95 backdrop-blur-sm border-b border-red-700/50 text-white text-sm font-bold"
        >
          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse flex-shrink-0" aria-hidden="true" />
          <span>You're offline. Some content may not load correctly.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
