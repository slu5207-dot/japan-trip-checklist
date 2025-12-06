"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // 注意這裡的路徑，原本是 @/firebase 可能會報錯，改成 ../firebase 比較保險
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Check, Plane, Snowflake, CreditCard, AlertCircle } from 'lucide-react';

// --- 資料設定 ---
const USERS = ['筱琪蛇', '錢人豪', '佳瑜', '庭妤', '宇漢蛇'];

const TRIP_INFO = {
  dates: "12/13(六) - 12/20(六)",
  flight: "已結清 (16362/人)",
  lodging: [
    { name: "新宿住宿", cost: "24399元 (未結)", status: "unpaid" },
    { name: "湯澤住宿", cost: "46522元 (待扣款)", status: "pending" },
  ],
  coach: "57000元 (未結)"
};

const CATEGORIES = [
  {
    id: 'must_have',
    title: '行李必帶 (🔴)',
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
    title: '可帶可不帶 (🔵)',
    icon: <Check className="w-5 h-5 text-blue-500" />,
    items: [
      '牙刷 (飯店有)', '牙膏 (飯店有)', '洗面乳', '護髮乳',
      '耳機', '筆電 (需轉接頭)', '雨傘', '衣架x2',
      '口罩', '拖鞋', '手機防水袋', '雪鏡 (戴眼鏡建議自備)', '暖暖包'
    ]
  },
  {
    id: 'todo',
    title: '11/29前 待辦事項',
    icon: <Snowflake className="w-5 h-5 text-cyan-500" />,
    items: [
      '滑雪保險 (富邦14天作業)',
      '雪具租借',
      '滑雪纜車票',
      'esim'
    ]
  }
];

// --- 元件 ---

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // 監聽資料庫變更
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const userDocRef = doc(db, "checklists", currentUser);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setChecklist(docSnap.data() as Record<string, boolean>);
      } else {
        // 如果第一次登入，建立空資料
        setDoc(userDocRef, {});
        setChecklist({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 切換勾選狀態
  const toggleItem = async (item: string) => {
    if (!currentUser) return;

    const newState = { ...checklist, [item]: !checklist[item] };
    setChecklist(newState); // Optimistic update

    try {
      await setDoc(doc(db, "checklists", currentUser), newState, { merge: true });
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  // 計算進度
  const totalItems = CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const progress = Math.round((checkedCount / totalItems) * 100) || 0;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">🇯🇵 日本滑雪特攻隊</h1>
          <p className="text-gray-500 mb-8">12/13 - 12/20 行前準備</p>
          <label className="block text-left mb-2 font-medium text-gray-700">你是誰？</label>
          <div className="grid grid-cols-1 gap-3">
            {USERS.map(user => (
              <button
                key={user}
                onClick={() => setCurrentUser(user)}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-lg font-medium text-gray-700"
              >
                {user}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 pb-12 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Hi, {currentUser} 👋</h1>
          <button onClick={() => setCurrentUser("")} className="text-sm bg-blue-700 px-3 py-1 rounded-full">切換</button>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-blue-800/50 rounded-full h-4 w-full overflow-hidden backdrop-blur-sm">
          <div 
            className="bg-green-400 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-right text-sm mt-1 text-blue-100">準備進度: {progress}%</p>
      </div>

      <div className="px-4 -mt-8 space-y-6 max-w-md mx-auto">
        
        {/* 個人行程卡片 */}
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
            <Plane className="w-5 h-5 text-purple-500" /> 你的行程資訊
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>📅 日期：{TRIP_INFO.dates}</p>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="font-semibold text-gray-700">交通/住宿：</span>
              {currentUser === '宇漢蛇' ? (
                <span className="block text-purple-600">🏨 前一天住附近飯店</span>
              ) : (currentUser === '錢人豪' || currentUser === '筱琪蛇') ? (
                <span className="block text-green-600">🚗 我 & 錢人豪 機場接送 (05:30到)</span>
              ) : (
                <span className="block text-green-600">🚗 佳瑜 & 庭妤 機場接送</span>
              )}
            </div>
          </div>
        </div>

        {/* 費用資訊 */}
        <div className="bg-white p-5 rounded-xl shadow-md">
           <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-yellow-500" /> 費用備忘錄
          </h3>
          <ul className="text-sm space-y-2">
            <li className="flex justify-between text-gray-500"><span>機票</span> <span>已結清</span></li>
            <li className="flex justify-between text-red-500 font-medium"><span>滑雪教練</span> <span>$57,000 (未結)</span></li>
            <li className="flex justify-between text-red-500 font-medium"><span>新宿住宿</span> <span>$24,399 (未結)</span></li>
            <li className="flex justify-between text-orange-500"><span>湯澤住宿</span> <span>$46,522 (待扣款)</span></li>
          </ul>
        </div>

        {/* 檢查清單 */}
        {CATEGORIES.map(category => (
          <div key={category.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                {category.icon} {category.title}
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {category.items.map(item => (
                <label key={item} className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="peer h-6 w-6 cursor-pointer appearance-none rounded-full border-2 border-gray-300 transition-all checked:border-green-500 checked:bg-green-500"
                      checked={checklist[item] || false}
                      onChange={() => toggleItem(item)}
                    />
                    <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 w-4 h-4" />
                  </div>
                  <span className={`ml-3 text-gray-700 ${checklist[item] ? 'line-through text-gray-400' : ''}`}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center text-gray-400 text-xs py-8">
        Made for Japan Trip 2025 🇯🇵
      </div>
    </div>
  );
}
