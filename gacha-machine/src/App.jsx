import { useState, useEffect } from 'react';

const CLASSES = ['701', '702', '703', '704', '7A', '7B', '7C', '7D', '7E', '7F'];

const EMOTIONS = [
  { id: 'joy', name: '樂樂', color: '黃色', className: 'bg-joy', textClass: 'text-joy' },
  { id: 'sadness', name: '憂憂', color: '藍色', className: 'bg-sadness', textClass: 'text-sadness' },
  { id: 'anger', name: '怒怒', color: '紅色', className: 'bg-anger', textClass: 'text-anger' },
  { id: 'fear', name: '驚驚', color: '紫色', className: 'bg-fear', textClass: 'text-fear' },
  { id: 'disgust', name: '厭厭', color: '綠色', className: 'bg-disgust', textClass: 'text-disgust' }
];

function App() {
  const [formData, setFormData] = useState({
    className: CLASSES[0],
    seatNumber: '',
    studentName: ''
  });
  
  const [currentViewClass, setCurrentViewClass] = useState(CLASSES[0]);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const [groupingData, setGroupingData] = useState([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTargetClass, setAdminTargetClass] = useState(CLASSES[0]);
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // 當班級改變時，自動抓取該班級的分組狀態
  useEffect(() => {
    fetchGroupingStatus(formData.className);
  }, [formData.className]);

  const fetchGroupingStatus = async (className) => {
    setCurrentViewClass(className); // 立即更新標題，避免不同步
    
    const scriptUrl = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;
    if (!scriptUrl) {
      // 如果還沒設定 GAS 網址，提供本機測試用的假資料
      setGroupingData([
        { seatNumber: "1", studentName: "王小明", color: "黃色", team: 1 },
        { seatNumber: "2", studentName: "李大華", color: "藍色", team: 1 },
        { seatNumber: "3", studentName: "陳小美", color: "紅色", team: 2 },
        { seatNumber: "4", studentName: "林阿德", color: "紫色", team: 2 },
        { seatNumber: "5", studentName: "張大頭", color: "綠色", team: 3 },
      ]);
      return;
    }

    setIsLoadingStatus(true);
    setGroupingData([]); // 取得新資料前先清空舊的，避免混淆
    try {
      const response = await fetch(`${scriptUrl}?className=${className}`);
      const data = await response.json();
      if (data.status === 'success') {
        setGroupingData(data.data);
      }
    } catch (err) {
      console.error("Error fetching status:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleDraw = async () => {
    // 驗證
    if (!formData.seatNumber || !formData.studentName) {
      setError('請輸入座號與姓名！');
      return;
    }

    setIsDrawing(true);
    setError('');

    // 隨機抽選顏色
    const randomEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];

    // 模擬抽獎動畫時間
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const scriptUrl = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;
      
      let assignedTeam = '?';
      
      if (scriptUrl) {
        const queryParams = new URLSearchParams({
          action: 'draw',
          className: formData.className,
          seatNumber: formData.seatNumber,
          studentName: formData.studentName,
          color: randomEmotion.color
        }).toString();
        
        const response = await fetch(`${scriptUrl}?${queryParams}`);
        
        const data = await response.json();
        if (data.status === 'success') {
          assignedTeam = data.team;
          // 抽完後重新抓取最新名單
          fetchGroupingStatus(formData.className);
        } else {
          console.error("GAS Error:", data.message);
          setError('紀錄失敗，請通知老師。');
        }
      } else {
        // 本機測試沒有 GAS URL 的情況
        assignedTeam = Math.floor(Math.random() * 3) + 1;
        setGroupingData(prev => [...prev, {
          seatNumber: formData.seatNumber,
          studentName: formData.studentName,
          color: randomEmotion.color,
          team: assignedTeam
        }]);
        setCurrentViewClass(formData.className);
      }

      setResult({
        emotion: randomEmotion,
        team: assignedTeam
      });

    } catch (err) {
      console.error(err);
      setError('錯誤: ' + (err.message || '網路錯誤'));
    } finally {
      setIsDrawing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFormData(prev => ({ ...prev, seatNumber: '', studentName: '' }));
  };

  const handleAdminSubmit = async () => {
    if (adminPassword !== '03080308') {
      setAdminError('密碼錯誤！');
      return;
    }
    
    setAdminError('');
    setIsAdminLoading(true);
    const scriptUrl = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;
    
    try {
      if (scriptUrl) {
        const queryParams = new URLSearchParams({
          action: 'reset',
          className: adminTargetClass
        }).toString();
        
        const response = await fetch(`${scriptUrl}?${queryParams}`);
        const data = await response.json();
        if (data.status === 'success') {
          alert(`已成功重置 ${adminTargetClass} 班級資料！`);
          setShowAdminModal(false);
          setAdminPassword('');
          if (formData.className === adminTargetClass) {
            fetchGroupingStatus(formData.className);
          }
        } else {
          setAdminError('重置失敗：' + data.message);
        }
      } else {
        alert('本機測試：已清除假資料 (僅前端)');
        setGroupingData([]);
        setShowAdminModal(false);
      }
    } catch (err) {
      setAdminError('網路錯誤');
    } finally {
      setIsAdminLoading(false);
    }
  };

  // 將名單依據組別分群
  const teamsMap = {};
  groupingData.forEach(student => {
    if (!teamsMap[student.team]) teamsMap[student.team] = [];
    teamsMap[student.team].push(student);
  });
  const teamsList = Object.keys(teamsMap).sort((a,b) => Number(a) - Number(b));

  const getColorClass = (colorName) => {
    const emotion = EMOTIONS.find(e => e.color === colorName);
    return emotion ? emotion.className : 'bg-gray-200';
  };

  return (
    <div className="app-container">
      <div className="header-section">
        <h1 className="title">【林口康橋TeamLab-腦筋急轉彎核心精英行動】</h1>
        <p className="description">
          七年級新生參加學校核心課程【林口康橋TeamLab-腦筋急轉彎核心精英行動】，每一位同學需抽一顆代表情緒顏色的[情緒腳色代表球]，並依抽到的顏色進行異質性分組。
        </p>
      </div>

      {!result ? (
        <>
          <div className="form-section">
            <div className="input-group">
              <label>班級</label>
              <select name="className" value={formData.className} onChange={handleInputChange} disabled={isDrawing}>
                {CLASSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>座號</label>
              <input 
                type="number" 
                name="seatNumber" 
                value={formData.seatNumber} 
                onChange={handleInputChange}
                placeholder="例如: 1"
                min="1"
                disabled={isDrawing}
              />
            </div>
            <div className="input-group">
              <label>姓名</label>
              <input 
                type="text" 
                name="studentName" 
                value={formData.studentName} 
                onChange={handleInputChange}
                placeholder="例如: 王小明"
                disabled={isDrawing}
              />
            </div>
            {error && <div style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>}
          </div>

          <div className="gacha-section">
            <div className={`gacha-machine ${isDrawing ? 'shaking' : ''}`}>
              <div className="gacha-top">
                <div className="gacha-balls-container">
                  <div className="gacha-ball-mini bg-joy" style={{ top: '65%', left: '25%' }}></div>
                  <div className="gacha-ball-mini bg-sadness" style={{ top: '75%', left: '45%' }}></div>
                  <div className="gacha-ball-mini bg-anger" style={{ top: '55%', left: '65%' }}></div>
                  <div className="gacha-ball-mini bg-fear" style={{ top: '80%', left: '75%' }}></div>
                  <div className="gacha-ball-mini bg-disgust" style={{ top: '45%', left: '40%' }}></div>
                </div>
              </div>
              <div className="gacha-base">
                <div className={`gacha-knob ${isDrawing ? 'spinning' : ''}`}>
                  <div className="gacha-knob-inner"></div>
                </div>
                <div className="gacha-dispenser"></div>
              </div>
            </div>

            <button 
              className={`draw-btn ${isDrawing ? 'active' : ''}`} 
              onClick={handleDraw}
              disabled={isDrawing}
            >
              {isDrawing ? '扭蛋中...' : '開始抽球'}
            </button>
            {isDrawing && <div className="loading-text">正在為您分配組別...</div>}
          </div>
        </>
      ) : (
        <div className="result-section">
          <h2>🎉 恭喜！你抽到了 🎉</h2>
          <div className={`result-ball grand-prize ${result.emotion.className}`}>
            {result.emotion.name}
          </div>
          <div className="result-info">
            <h2>{formData.className} 班 {formData.seatNumber} 號 {formData.studentName}</h2>
            <p style={{fontSize: '1.2rem', marginTop: '10px'}}>
              代表角色：<strong className={result.emotion.textClass}>{result.emotion.name} ({result.emotion.color})</strong>
            </p>
            <h3>🌟 你被分配到第 【 {result.team} 】 小隊 🌟</h3>
          </div>
          <button className="reset-btn" onClick={handleReset}>下一位同學</button>
        </div>
      )}

      {/* 分組狀況區塊 */}
      <div className="status-section">
        <h2>{currentViewClass} 班目前分組名單</h2>
        {isLoadingStatus ? (
          <p className="loading-text">載入中...</p>
        ) : teamsList.length > 0 ? (
          <div className="teams-container">
            {teamsList.map(team => (
              <div key={team} className="team-card">
                <h3>第 {team} 小隊 ({teamsMap[team].length}人)</h3>
                <div className="student-tags">
                  {teamsMap[team].map((student, idx) => (
                    <span 
                      key={idx} 
                      className={`student-tag ${getColorClass(student.color)}`}
                    >
                      {student.seatNumber}. {student.studentName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>目前班上還沒有人抽籤喔！</p>
        )}
      </div>

      {/* NPC 管理員按鈕 */}
      <button className="admin-btn" onClick={() => setShowAdminModal(true)}>
        ⚙️
      </button>

      {/* 管理員重置彈窗 */}
      {showAdminModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>管理員設定 (NPC)</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>請輸入密碼以進行班級重置操作</p>
            
            <input 
              type="password" 
              placeholder="請輸入密碼" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
            
            <select value={adminTargetClass} onChange={(e) => setAdminTargetClass(e.target.value)}>
              {CLASSES.map(c => <option key={c} value={c}>{c} 班</option>)}
            </select>
            
            {adminError && <div style={{ color: 'red', marginTop: '5px' }}>{adminError}</div>}
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAdminModal(false)}>取消</button>
              <button 
                className="btn-confirm" 
                onClick={handleAdminSubmit}
                disabled={isAdminLoading}
              >
                {isAdminLoading ? '處理中...' : '確認重置'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
