import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export default function LoginModal({ isOpen, onClose, defaultTab = 'login' }: LoginModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();

  // 重置 tab
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setError('');
      setSuccess('');
    }
  }, [isOpen, defaultTab]);

  // 登录成功后自动关闭
  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  // ESC 键关闭
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function switchTab(newTab: 'login' | 'register') {
    setTab(newTab);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await signIn(email, password);
      } else {
        if (!username.trim()) {
          setError('请输入用户名');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('密码至少 6 位');
          setLoading(false);
          return;
        }
        await signUp(email, password, username.trim());
        setSuccess('注册成功！请查看邮箱完成验证');
      }
    } catch {
      setError(tab === 'login' ? '登录失败，请检查邮箱和密码' : '注册失败，邮箱可能已被使用');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* 弹窗 */}
      <div
        className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-apple-xl p-8 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-apple-gray-400 hover:text-apple-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Tab 切换 */}
        <div className="flex bg-apple-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => switchTab('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
              tab === 'login'
                ? 'bg-white text-apple-gray-600 shadow-sm'
                : 'text-apple-gray-400 hover:text-apple-gray-500'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => switchTab('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
              tab === 'register'
                ? 'bg-white text-apple-gray-600 shadow-sm'
                : 'text-apple-gray-400 hover:text-apple-gray-500'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 注册时显示用户名 */}
          {tab === 'register' && (
            <div>
              <label htmlFor="auth-username" className="block text-sm font-medium text-apple-gray-500 mb-1">
                用户名
              </label>
              <input
                id="auth-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-apple-gray-100 rounded-xl text-sm text-apple-gray-600 placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/30 transition-all"
                placeholder="你的昵称"
                autoComplete="username"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-apple-gray-500 mb-1">
              邮箱
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-apple-gray-100 rounded-xl text-sm text-apple-gray-600 placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/30 transition-all"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-apple-gray-500 mb-1">
              密码
            </label>
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-apple-gray-100 rounded-xl text-sm text-apple-gray-600 placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/30 transition-all"
              placeholder={tab === 'register' ? '至少 6 位' : '••••••••'}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              minLength={tab === 'register' ? 6 : undefined}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full py-2.5 bg-apple-blue text-white text-sm font-medium rounded-xl hover:bg-apple-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {tab === 'login' ? '登录中...' : '注册中...'}
              </>
            ) : (
              tab === 'login' ? '登录' : '注册'
            )}
          </button>
        </form>

        <p className="text-xs text-apple-gray-400 text-center mt-4">
          {tab === 'login' ? (
            <>没有账号？<button onClick={() => switchTab('register')} className="text-apple-blue hover:underline">注册</button></>
          ) : (
            <>已有账号？<button onClick={() => switchTab('login')} className="text-apple-blue hover:underline">登录</button></>
          )}
        </p>
      </div>
    </div>
  );
}
