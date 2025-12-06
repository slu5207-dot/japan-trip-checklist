"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Check, Plane, CreditCard, AlertCircle, ShoppingBag, MapPin, Calendar, LogOut, ChevronDown, Sparkles } from 'lucide-react';

// --- 1. 更新人名 (登入選單) ---
const USERS = ['筱琪蛇', '錢', '佳瑜', '那個庭', '宇漢蛇'];

const TRIP_INFO = {
  dates: "12/13(六) - 12/20(六)",
  lodging: [
    { name: "新宿住宿", cost: "24,399", status: "unpaid" },
    { name: "湯澤住宿", cost: "46,522", status: "pending" },
  ],
};

const RENTAL_LIST = [
  { name: "套裝1 (板+鞋+衣+褲)", count: "4組" },
  { name: "套裝2 (板+鞋)", count: "1組" },
  { name: "安全帽", count: "5頂" },
  { name: "雪鏡", count: "1個" },
  { name: "防摔褲", count: "4件" },
  // 已移除護膝
];

const CATEGORIES = [
  {
    id: 'must_have',
    title: '絕對要帶 (🔴)',
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    items: [
      '護照', '信用卡', '日幣', '手機', '充電線',
      '行動電源 (隨身限2個)',
      '內層: 衣服x5 + 排汗衫x2',
      '中層: 刷毛/羽絨服飾x2',
      '內層: 褲子x5 + 排汗褲x2',
      '中層: 刷毛/羽絨運動褲x2',
      '毛帽 (蓋耳/少飾品)', '面罩', '內衣褲x7',
      '襪子x4 + 滑雪襪x3', '睡衣x1', '厚外套', '隨身小包包'
    ]
  },
  {
    id: 'optional',
    title: '分配/選用 (🔵)',
    icon: <Check className="w-5 h-5 text-blue-500" />,
    items: [
      // --- 2. 更新人名 (清單內容文字) ---
      '牙膏 (宇漢蛇負責)', 
      '洗面乳 (佳瑜負責)', 
      '護髮油 (筱琪蛇負責)', 
      '乳液 (那個庭負責)',
      '牙刷 (飯店有)', 
      '耳機', '筆電 (需轉接頭)', '雨傘', '衣架x2',
      '口罩', '拖鞋', '手機防水袋', '雪鏡 (戴眼鏡建議自備)', '暖暖包'
    ]
  },
  {
    id: 'todo',
    title: '行前待辦 (11/29前)',
    icon: <Calendar className="w-5 h-5 text-cyan-600" />,
    items: [
      '滑雪保險 (富邦14天作業)',
      '雪具租借 (詳見上方清單)',
      '滑雪纜車票',
      'esim (已購買，詳見費用)'
    ]
  }
];

// 煙火粒子組件
const Confetti = () => {
  const [particles, setParticles] = useState<{id: number, left: number, delay: number, duration: number}[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full"
          style={{
            left: `${p.left}%`,
            top: '-10px',
            animation: `confetti ${p.duration}s ease-out forwards`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// 飄雪組件
const SnowEffect = () => {
  const [snowflakes, setSnowflakes] = useState<{id: number, left: number, delay: number, duration: number, size: number}[]>([]);

  useEffect(() => {
    setSnowflakes(Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 10,
      size: 4 + Math.random() * 6,
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {snowflakes.map((s) => (
        <div
          key={s.id}
          className="absolute bg-white rounded-full opacity-80 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animation: `snow-fall ${s.duration}s linear infinite`,
            animationDelay: `${s.delay}s`,
            top: '-20px',
          }}
        />
      ))}
    </div>
  );
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const userDocRef = doc(db, "checklists", currentUser);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setChecklist(docSnap.data() as Record<string, boolean>);
      } else {
        setDoc(userDocRef, {});
        setChecklist({});
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const toggleItem = async (item: string) => {
    if (!currentUser) return;
    const newState = { ...checklist, [item]: !checklist[item] };
    setChecklist(newState);
    try {
      await setDoc(doc(db, "checklists", currentUser), newState, { merge: true });
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const totalItems = CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const progress = Math.round((checkedCount / totalItems) * 100) || 0;

  useEffect(() => {
    if (progress === 100 && checkedCount > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [progress, checkedCount]);

  // --- CSS 樣式定義 ---
  const globalStyles = `
    @keyframes snow-fall {
      0% { transform: translateY(-10vh) translateX(-10px) rotate(0deg); opacity: 0; }
      20% { opacity: 1; }
      100% { transform: translateY(110vh) translateX(10px) rotate(360deg); opacity: 0.3; }
    }
    @keyframes confetti {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slide-in-left {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slide-in-right {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-float { animation: float 4s ease-in-out infinite; }
    .animate-fade-in { animation: fade-in 0.8s ease-out; }
    .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; }
    .animate-slide-in-left { animation: slide-in-left 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }
    .animate-slide-in-right { animation: slide-in-right 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }
    .animate-spin-slow { animation: spin-slow 3s linear infinite; }
  `;

  // --- 登入畫面 ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <style>{globalStyles}</style>
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-110 blur-[2px]"
          style={{ backgroundImage: "url('/bg.png')" }}
        />
        <div className="absolute inset-0 bg-black/20 z-0" />
        
        <SnowEffect />

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center relative z-20 border border-white/20 animate-fade-in-up">
          <div className="mb-6 inline-block p-5 bg-gradient-to-br from-white/20 to-white/5 rounded-full text-6xl shadow-lg animate-float backdrop-blur-md border border-white/30">
            🗻
          </div>
          <h1 className="text-4xl font-black mb-3 text-white tracking-tight drop-shadow-lg">
            日本滑雪特攻隊
          </h1>
          <p className="text-cyan-100 mb-8 font-medium text-base tracking-widest uppercase">Ready for Snow?</p>
          
          <div className="space-y-3">
            {USERS.map((user, idx) => (
              <button
                key={user}
                onClick={() => setCurrentUser(user)}
                className="w-full py-4 px-6 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-cyan-500 hover:text-white hover:border-transparent hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:scale-105 transition-all duration-300 font-bold text-slate-700 animate-fade-in-up shadow-lg"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {user}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- 主畫面 ---
  return (
    <div className="min-h-screen pb-20 relative bg-slate-100">
      <style>{globalStyles}</style>
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90"
        style={{ backgroundImage: "url('/bg.png')" }}
      />
      <div className="fixed inset-0 bg-slate-50/80 z-0 pointer-events-none backdrop-blur-[1px]" />

      <SnowEffect />
      
      {showConfetti && <Confetti />}

      <div className="relative z-20">
        
        {/* Header 圖片區域 */}
        <div className="relative w-full aspect-[16/9] rounded-b-[3rem] overflow-hidden shadow-2xl animate-fade-in group">
          <img src="/header.png" alt="Header" className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex justify-between items-end mb-4">
              <div className="animate-slide-in-left">
                <p className="text-cyan-300 text-xs font-bold mb-1 tracking-[0.3em] uppercase drop-shadow-md">Japan Trip 2025</p>
                <h1 className="text-4xl font-black drop-shadow-xl bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
                  Hi, {currentUser}
                </h1>
              </div>
              <button 
                onClick={() => setCurrentUser("")} 
                className="text-xs font-bold bg-white/10 backdrop-blur-xl border border-white/30 text-white px-4 py-2 rounded-full hover:bg-red-500/80 hover:border-red-400 transition-all duration-300 flex items-center gap-1.5 shadow-lg animate-slide-in-right"
              >
                <LogOut className="w-3.5 h-3.5" /> 登出
              </button>
            </div>

            {/* 圓形進度環 */}
            <div className="flex items-center gap-5 animate-fade-in bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/10" style={{ animationDelay: '0.2s' }}>
              <div className="relative w-14 h-14">
                <svg className="transform -rotate-90 w-14 h-14 drop-shadow-lg">
                  <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
                  <circle
                    cx="28" cy="28" r="24"
                    stroke="url(#gradient)" strokeWidth="6" fill="none"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-white drop-shadow-md">{progress}%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-cyan-200 text-xs font-bold mb-0.5">準備進度</p>
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-bold tracking-wide">
                    {checkedCount} / {totalItems} 完成
                  </p>
                  {progress === 100 && <Sparkles className="w-4 h-4 text-yellow-300 animate-spin-slow" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-8 space-y-6 max-w-md mx-auto pt-12 pb-12">
          
          {/* 快速統計 (懸浮卡片) */}
          <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {[
              { label: '必帶', count: CATEGORIES[0].items.length, color: 'text-red-500', bg: 'from-red-50 to-pink-50', border: 'border-red-100' },
              { label: '選用', count: CATEGORIES[1].items.length, color: 'text-blue-500', bg: 'from-blue-50 to-cyan-50', border: 'border-blue-100' },
              { label: '待辦', count: CATEGORIES[2].items.length, color: 'text-purple-500', bg: 'from-purple-50 to-violet-50', border: 'border-purple-100' },
            ].map((stat, i) => (
              <div key={i} className={`bg-gradient-to-br ${stat.bg} backdrop-blur-xl p-3 rounded-2xl shadow-lg border ${stat.border} text-center transform transition-transform hover:-translate-y-1 duration-300`}>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
                <p className={`text-xs font-bold ${stat.color} opacity-80`}>{stat.label}</p>
              </div>
            ))}
          </div>
          
          {/* 行程資訊卡片 */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 animate-fade-in-up hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-black text-slate-800 flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Plane className="w-5 h-5" /></div>
              行程資訊
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700 font-bold tracking-wide">{TRIP_INFO.dates}</span>
              </div>
              <div className="flex items-start gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-slate-400 text-xs mb-1 font-bold uppercase">Transport</p>
                  {/* --- 3. 更新人名 (行程邏輯與顯示) --- */}
                  {currentUser === '宇漢蛇' ? (
                    <span className="inline-flex items-center gap-1 text-purple-700 font-bold text-xs">🏨 前一天住附近飯店</span>
                  ) : (currentUser === '錢' || currentUser === '筱琪蛇') ? (
                    <span className="inline-flex items-center gap-1 text-green-700 font-bold text-xs">🚗 我 & 錢 機場接送 (05:30到)</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-green-700 font-bold text-xs">🚗 佳瑜 & 那個庭 機場接送</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 費用與租借 */}
          <div className="grid grid-cols-1 gap-5">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="font-black text-slate-800 flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><CreditCard className="w-5 h-5" /></div>
                費用明細
              </h3>
              <ul className="text-sm space-y-3">
                <li className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="text-slate-500 font-medium">機票</span> 
                  <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold">已結清</span>
                </li>
                <li className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="text-slate-700 font-bold">eSIM</span> 
                  <span className="font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">$3,723 (錢先付)</span>
                </li>
                <li className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="text-slate-700 font-bold">交通票 (機場/三日卷)</span> 
                  <span className="font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">$7,060 (錢先付)</span>
                </li>
                <li className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="text-slate-700 font-bold">滑雪教練</span> 
                  <span className="font-black text-red-500 bg-red-50 px-2 py-1 rounded">$57,000</span>
                </li>
                <li className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="text-slate-700 font-bold">新宿住宿</span> 
                  <span className="font-black text-red-500 bg-red-50 px-2 py-1 rounded">$24,399</span>
                </li>
                <li className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="text-slate-700 font-bold">湯澤住宿</span> 
                  <span className="font-black text-orange-500 bg-orange-50 px-2 py-1 rounded">$46,522</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-cyan-100 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="font-black text-cyan-900 flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-200 rounded-lg text-cyan-700"><ShoppingBag className="w-5 h-5" /></div>
                雪具租借
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {RENTAL_LIST.map((item, idx) => (
                  <div key={idx} className="bg-white/60 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm border border-white/50 hover:scale-105 transition-transform duration-200">
                    <span className="text-slate-500 mb-1 font-medium">{item.name}</span>
                    <span className="font-black text-cyan-600 text-lg">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 檢查清單類別 - 可折疊 */}
          {CATEGORIES.map((category, catIdx) => {
            const isCollapsed = collapsedCategories.has(category.id);
            const categoryChecked = category.items.filter(item => checklist[item]).length;
            const isComplete = categoryChecked === category.items.length;
            
            return (
              <div 
                key={category.id} 
                className={`bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border transition-all duration-300 animate-fade-in-up ${isComplete ? 'border-green-200 bg-green-50/30' : 'border-white/60'}`}
                style={{ animationDelay: `${0.5 + catIdx * 0.1}s` }}
              >
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                      {isComplete ? <Check className="w-5 h-5" /> : category.icon}
                    </div>
                    <div className="text-left">
                      <h3 className={`font-black text-base ${isComplete ? 'text-green-800' : 'text-slate-800'}`}>
                        {category.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {isComplete ? '全數完成！太棒了' : `還有 ${category.items.length - categoryChecked} 項待準備`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* 進度條小元件 */}
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${(categoryChecked / category.items.length) * 100}%` }}
                      />
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
                    />
                  </div>
                </button>
                
                <div 
                  className={`divide-y divide-slate-100/50 transition-all duration-500 ease-in-out overflow-hidden ${
                    isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
                  }`}
                >
                  {category.items.map((item, idx) => (
                    <label 
                      key={item} 
                      className="flex items-center p-4 pl-16 cursor-pointer hover:bg-blue-50/30 transition-colors duration-200 group"
                    >
                      <div className="relative flex items-center mr-4">
                        <input 
                          type="checkbox" 
                          className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-slate-300 transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400"
                          checked={checklist[item] || false}
                          onChange={() => toggleItem(item)}
                        />
                        <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 peer-checked:scale-100 scale-50 transition-all duration-200 w-4 h-4" />
                      </div>
                      <span className={`text-sm font-semibold transition-all duration-300 ${
                        checklist[item] 
                          ? 'line-through text-slate-400 decoration-slate-300' 
                          : 'text-slate-700 group-hover:text-blue-600'
                      }`}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-center text-slate-400 text-xs py-8 font-bold tracking-wider animate-fade-in opacity-50">
          Designed for Japan Trip 2025
        </div>
      </div>
    </div>
  );
}
