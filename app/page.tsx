"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Check, Plane, CreditCard, AlertCircle, ShoppingBag, MapPin, Calendar, LogOut } from 'lucide-react';

// --- 資料設定 ---
const USERS = ['筱琪蛇', '錢人豪', '佳瑜', '庭妤', '宇漢蛇'];

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
  { name: "護膝", count: "1個" },
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
      '牙膏 (宇漢負責)', 
      '洗面乳 (佳瑜負責)', 
      '護髮油 (筱琪負責)', 
      '乳液 (庭妤負責)',
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
      'esim'
    ]
  }
];

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

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

  const totalItems = CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const progress = Math.round((checkedCount / totalItems) * 100) || 0;

  // --- 登入畫面 ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* 全螢幕背景圖 */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/bg.png')" }}
        />
        {/* 淺色遮罩，確保文字可讀 */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-0" />

        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center relative z-10 border border-white/60">
          <div className="mb-4 inline-block p-3 bg-blue-100/80 rounded-full text-4xl shadow-sm">🗻</div>
          <h1 className="text-3xl font-extrabold mb-2 text-slate-800 tracking-tight">日本滑雪特攻隊</h1>
          <p className="text-slate-600 mb-8 font-medium">12/13 - 12/20 行前準備</p>
          
          <div className="space-y-3">
            {USERS.map(user => (
              <button
                key={user}
                onClick={() => setCurrentUser(user)}
                className="w-full py-3.5 px-6 bg-white/90 border border-slate-200 rounded-xl hover:bg-cyan-600 hover:text-white hover:border-transparent hover:shadow-lg transition-all duration-200 font-bold text-slate-600"
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
    <div className="min-h-screen pb-20 relative">
      {/* 固定背景圖 */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg.png')" }}
      />
      {/* 背景遮罩 (讓背景變淡一點，才不會干擾閱讀) */}
      <div className="fixed inset-0 bg-slate-50/70 z-0 pointer-events-none" />

      <div className="relative z-10">
        
        {/* Header 圖片區域 */}
        <div className="relative w-full aspect-[16/9] rounded-b-[2.5rem] overflow-hidden shadow-xl">
          {/* 橫幅圖片 */}
          <img src="/header.png" alt="Header" className="w-full h-full object-cover" />
          
          {/* 漸層遮罩：讓文字清楚顯示 */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
          
          {/* Header 內容 */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-cyan-300 text-sm font-bold mb-1 tracking-wider">JAPAN TRIP 2025</p>
                <h1 className="text-3xl font-bold drop-shadow-md">Hi, {currentUser} 👋</h1>
              </div>
              <button 
                onClick={() => setCurrentUser("")} 
                className="text-xs font-bold bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" /> 登出
              </button>
            </div>

            {/* 進度條 */}
            <div className="relative pt-1">
              <div className="flex mb-1 items-center justify-between text-xs font-medium text-cyan-100">
                <span>準備進度</span>
                <span>{progress}%</span>
              </div>
              <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-white/20 backdrop-blur-sm border border-white/10">
                <div 
                  style={{ width: `${progress}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700 ease-out box-shadow-glow"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-6 max-w-md mx-auto pt-8">
          
          {/* 行程資訊卡片 */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/60">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Plane className="w-5 h-5 text-indigo-500" /> 行程資訊
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <span className="text-slate-600 font-medium">{TRIP_INFO.dates}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-slate-500 text-xs mb-1">交通安排</p>
                  {currentUser === '宇漢蛇' ? (
                    <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">🏨 前一天住附近飯店</span>
                  ) : (currentUser === '錢人豪' || currentUser === '筱琪蛇') ? (
                    <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">🚗 我 & 錢人豪 機場接送 (05:30到)</span>
                  ) : (
                    <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">🚗 佳瑜 & 庭妤 機場接送</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 費用與租借 雙欄佈局 */}
          <div className="grid grid-cols-1 gap-4">
            {/* 費用 */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/60">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-amber-500" /> 費用
              </h3>
              <ul className="text-sm space-y-2">
                <li className="flex justify-between text-slate-400"><span>機票</span> <span>已結清</span></li>
                <li className="flex justify-between text-slate-700"><span>滑雪教練</span> <span className="font-bold text-red-500">$57,000</span></li>
                <li className="flex justify-between text-slate-700"><span>新宿住宿</span> <span className="font-bold text-red-500">$24,399</span></li>
                <li className="flex justify-between text-slate-700"><span>湯澤住宿</span> <span className="font-bold text-orange-500">$46,522</span></li>
              </ul>
            </div>

            {/* 租借清單 */}
            <div className="bg-gradient-to-br from-cyan-50/90 to-blue-50/90 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-cyan-100">
              <h3 className="font-bold text-cyan-800 flex items-center gap-2 mb-3">
                <ShoppingBag className="w-5 h-5 text-cyan-600" /> 雪具租借 (共用)
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {RENTAL_LIST.map((item, idx) => (
                  <div key={idx} className="bg-white/60 p-2 rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-slate-500 mb-1">{item.name}</span>
                    <span className="font-bold text-cyan-600 text-sm">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 檢查清單類別 */}
          {CATEGORIES.map(category => (
            <div key={category.id} className="bg-white/85 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-white/60">
              <div className="bg-slate-50/50 p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  {category.icon} {category.title}
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {category.items.map(item => (
                  <label key={item} className="flex items-center p-4 cursor-pointer hover:bg-blue-50/50 transition-colors group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition-all checked:border-blue-500 checked:bg-blue-500"
                        checked={checklist[item] || false}
                        onChange={() => toggleItem(item)}
                      />
                      <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 w-3.5 h-3.5" />
                    </div>
                    <span className={`ml-3 text-sm font-medium transition-all ${checklist[item] ? 'line-through text-slate-400' : 'text-slate-700 group-hover:text-blue-600'}`}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center text-slate-400 text-xs py-8 font-medium">
          Made with ❤️ for Japan Trip 2025
        </div>
      </div>
    </div>
  );
}
