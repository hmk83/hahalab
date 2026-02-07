import React, { useState } from 'react';
import { ArrowRight, Lock, X } from 'lucide-react';
import { Button } from '../components/Button';
import { checkEntryPassword } from '../utils/auth';

interface LandingProps {
  onEnter: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkEntryPassword(password)) {
      onEnter();
    } else {
      setError(true);
      setPassword('');
      // Shake animation or error indication could be added here
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-kakao-yellow flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

      <div className="z-10 flex flex-col items-center text-center space-y-12">
        <div className="animate-pop-in space-y-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-kakao-brown drop-shadow-sm">
            HAHA<br/>LAB
          </h1>
          <p className="text-xl md:text-2xl font-bold text-kakao-brown/80 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            즐거운 배움이 시작되는 곳
          </p>
        </div>

        <div className="animate-fade-in-up w-full max-w-xs" style={{ animationDelay: '0.6s' }}>
          <Button onClick={() => setIsModalOpen(true)} fullWidth className="text-xl py-4 bg-white hover:bg-gray-50 text-kakao-brown shadow-lg">
            접속하기
            <ArrowRight size={24} />
          </Button>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-kakao-brown/40 text-sm font-medium">
        © 2026 HAHA LAB Corp.
      </div>

      {/* Password Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl animate-pop-in">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                 <Lock size={18} /> 김은애 선생님
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                 <X size={20}/>
               </button>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input 
                  type="password" 
                  autoFocus
                  placeholder="접속 코드를 입력하세요" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:outline-none transition-all text-center text-lg tracking-widest ${error ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-kakao-yellow'}`}
                  maxLength={4}
                  inputMode="numeric"
                />
                {error && <p className="text-xs text-red-500 mt-2 text-center font-bold">코드가 올바르지 않습니다.</p>}
              </div>
              <Button type="submit" fullWidth className={error ? 'bg-red-500 hover:bg-red-600 text-white' : ''}>
                확인
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};