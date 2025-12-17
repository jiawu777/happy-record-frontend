import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ScatterChart, Scatter, ZAxis, ResponsiveContainer } from 'recharts';
import { Play, Pause, RotateCcw, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [view, setView] = useState('timer'); // timer, form, dashboard
  const [isPlaying, setIsPlaying] = useState(false);
  const [key, setKey] = useState(0); // 用於重置計時器
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState(25 * 60); // 預設 25 分鐘
  
  // 表單資料
  const [formData, setFormData] = useState({ pleasure: 3, energy: 3, tags: '' });
  
  // 統計資料
  const [stats, setStats] = useState([]);

  // 1. 計時器結束處理
  const handleComplete = () => {
    setIsPlaying(false);
    alert("專注完成！請紀錄你的狀態 📝");
    setView('form');
  };

  // 2. 送出表單
  const handleSubmit = async () => {
    if(!taskName) return alert("請輸入任務名稱");
    try {
      await axios.post(`${API_URL}/api/record`, {
        taskName,
        duration: duration / 60, // 存成分鐘
        pleasure: formData.pleasure,
        energy: formData.energy,
        tags: formData.tags
      });
      alert("紀錄成功！🎉");
      fetchStats(); // 更新數據
      setView('dashboard');
    } catch (error) {
      console.error(error);
      alert("儲存失敗，請檢查網路或後端");
    }
  };

  // 3. 抓取統計數據
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/data`);
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if(view === 'dashboard') fetchStats();
  }, [view]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>🍅 快樂計時器</h1>
        <button onClick={() => setView(view === 'dashboard' ? 'timer' : 'dashboard')}>
          {view === 'dashboard' ? '回到計時' : '查看分析'}
        </button>
      </header>

      {/* --- 計時器介面 --- */}
      {view === 'timer' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <input 
            type="text" 
            placeholder="今天想專注什麼任務？" 
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            style={{ padding: '10px', width: '100%', fontSize: '16px' }}
          />
          
          <CountdownCircleTimer
            key={key}
            isPlaying={isPlaying}
            duration={duration}
            colors={['#004777', '#F7B801', '#A30000', '#A30000']}
            colorsTime={[duration, duration * 0.6, duration * 0.3, 0]}
            onComplete={handleComplete}
          >
            {({ remainingTime }) => {
              const minutes = Math.floor(remainingTime / 60);
              const seconds = remainingTime % 60;
              return <div style={{ fontSize: '32px' }}>{`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}</div>;
            }}
          </CountdownCircleTimer>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '10px 20px', fontSize: '18px' }}>
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button onClick={() => { setIsPlaying(false); setKey(prev => prev + 1); }} style={{ padding: '10px 20px', fontSize: '18px' }}>
              <RotateCcw />
            </button>
          </div>
        </div>
      )}

      {/* --- 填寫表單介面 --- */}
      {view === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3>剛才的任務：{taskName}</h3>
          
          <label>😊 愉悅程度 (1-5): {formData.pleasure}</label>
          <input 
            type="range" min="1" max="5" 
            value={formData.pleasure} 
            onChange={(e) => setFormData({...formData, pleasure: Number(e.target.value)})} 
          />

          <label>⚡ 耗費精力 (1-5): {formData.energy}</label>
          <input 
            type="range" min="1" max="5" 
            value={formData.energy} 
            onChange={(e) => setFormData({...formData, energy: Number(e.target.value)})} 
          />

          <label>🏷️ 標籤 (選填)</label>
          <input 
            type="text" placeholder="例：工作, 學習"
            value={formData.tags}
            onChange={(e) => setFormData({...formData, tags: e.target.value})}
            style={{ padding: '8px' }}
          />

          <button onClick={handleSubmit} style={{ marginTop: '10px', padding: '10px', background: '#4CAF50', color: 'white', border: 'none' }}>
            <Save size={16} style={{marginRight: '5px'}}/> 儲存紀錄
          </button>
        </div>
      )}

      {/* --- 儀表板介面 --- */}
      {view === 'dashboard' && (
        <div>
          <h3>📊 能量分析圖表</h3>
          <p>近期任務分析 (數據來自 Google Sheets)</p>

          <h4>❤️ 最快樂的任務 (愉悅 > 3)</h4>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.filter(s => s.pleasure > 3)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="taskName" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pleasure" fill="#8884d8" name="愉悅度" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h4>🔋 能量消耗矩陣 (X:精力, Y:愉悅)</h4>
          <div style={{ height: 300 }}>
             <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis type="number" dataKey="energy" name="精力消耗" unit="分" domain={[0, 6]} />
                <YAxis type="number" dataKey="pleasure" name="愉悅度" unit="分" domain={[0, 6]} />
                <ZAxis type="category" dataKey="taskName" name="任務" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Tasks" data={stats} fill="#82ca9d" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;