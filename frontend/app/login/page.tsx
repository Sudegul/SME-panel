'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authAPI } from '@/lib/axios';
import { LogIn, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Background image preload - LCP (Largest Contentful Paint) optimizasyonu
  // Mantık: Browser'a "bu görseli erkenden yükle" diyoruz, böylece sayfa daha hızlı render olur
  const backgroundImage = theme === 'dark' ? '/images/dark_background.png' : '/images/background.png';

  // Preload meta tag ekle (useEffect ile head'e inject ediyoruz)
  if (typeof window !== 'undefined') {
    // Client-side rendering - tarayıcı preload yapabilir
    const existingPreload = document.querySelector('link[rel="preload"][as="image"]');
    if (!existingPreload) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = backgroundImage;
      document.head.appendChild(link);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      localStorage.setItem('token', response.data.access_token);
      toast.success('Giriş başarılı! Yönlendiriliyorsunuz...');
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Giriş başarısız oldu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImage})`, // Preload edilmiş background image
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-md">
        {/* Dark Mode Toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-lg transition-colors border ${
              theme === 'dark'
                ? 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.1)]'
                : 'bg-[#F4FBF6] hover:bg-[#E8F5EC] border-[#D6EEE3]'
            }`}
            title={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-[#1A5C47]" />}
          </button>
        </div>

        {/* Logo - Next.js Image ile optimize edilmiş */}
        {/* Mantık: next/image otomatik olarak WebP format'a çevirir, lazy loading yapar, boyut optimize eder */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={210}
              height={210}
              priority // LCP için önemli - sayfa açılır açılmaz yüklensin
              className="w-auto h-auto max-h-[210px]"
            />
          </div>
          <p className="text-gray-500 dark:text-gray-400">Satış Yönetim Sistemi</p>
        </div>

        {/* Login Card */}
        <div className={`rounded-xl shadow-sm backdrop-blur-sm p-8 ${
          theme === 'dark'
            ? 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)]'
            : 'bg-[#F4FBF6] border-[#D6EEE3]'
        } border`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#0F4C3A] dark:focus:ring-[#1E3A32] focus:border-transparent outline-none transition ${
                  theme === 'dark'
                    ? 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)]'
                    : 'bg-[#E8F5EC] border-[#D6EEE3]'
                }`}
                placeholder="ornek@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#0F4C3A] dark:focus:ring-[#1E3A32] focus:border-transparent outline-none transition ${
                  theme === 'dark'
                    ? 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)]'
                    : 'bg-[#E8F5EC] border-[#D6EEE3]'
                }`}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-medium py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'dark'
                  ? 'bg-[#264A3F] hover:bg-[#1E3A32]'
                  : 'bg-[#1A5C47] hover:bg-[#144A39]'
              }`}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8">
          © 2025 SME Satış Yönetim Sistemi. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
