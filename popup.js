// 彈出窗口管理
class PopupManager {
  constructor() {
    this.sellerData = {};
    this.init();
    
    // 監聽 storage 變化，自動刷新
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.sellerData) {
        this.sellerData = changes.sellerData.newValue || {};
        this.renderStats();
        this.renderSellerList();
      }
    });
  }

  async init() {
    await this.loadData();
    this.renderStats();
    this.renderSellerList();
    this.bindEvents();
  }

  // 載入賣家數據
  async loadData() {
    try {
      const result = await chrome.storage.sync.get(['sellerData']);
      this.sellerData = result.sellerData || {};
    } catch (error) {
      console.error('載入數據失敗:', error);
    }
  }

  // 渲染統計信息
  renderStats() {
    const sellers = Object.values(this.sellerData);
    const goodCount = sellers.filter(s => s.status === 'good').length;
    const badCount = sellers.filter(s => s.status === 'bad').length;

    document.getElementById('goodCount').textContent = goodCount;
    document.getElementById('badCount').textContent = badCount;
  }

  // 渲染賣家列表
  renderSellerList() {
    const listContainer = document.getElementById('sellerList');
    const emptyState = document.getElementById('emptyState');
    
    const sellers = Object.entries(this.sellerData);
    
    if (sellers.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    
    // 按時間排序（最新的在前）
    sellers.sort((a, b) => b[1].timestamp - a[1].timestamp);
    
    listContainer.innerHTML = sellers.map(([sellerId, data]) => `
      <div class="seller-item" data-seller-id="${sellerId}">
        <div class="seller-name" title="${data.name}${data.note ? '\n備註: ' + data.note : ''}">
          ${data.name}
          ${data.note ? '📝' : ''}
        </div>
        <div class="seller-status status-${data.status}">
          ${this.getStatusText(data.status)}
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <button class="seller-tracker-btn good" data-action="good" data-seller-id="${sellerId}">👍 好評</button>
        <button class="seller-tracker-btn bad" data-action="bad" data-seller-id="${sellerId}">👎 避開</button>
        <button class="seller-tracker-btn note" data-action="note" data-seller-id="${sellerId}">📝 備註</button>
      </div>
      <div style="font-size:11px; color:#ffd; margin:2px 0 8px 0; padding-left:4px;">
        ${data.note ? `📝 備註：${data.note}<br>` : ''}
        <span style="opacity:0.7;">標記時間：${data.timestamp ? new Date(data.timestamp).toLocaleString() : ''}</span>
      </div>
    `).join('');

    // 綁定按鈕事件
    listContainer.querySelectorAll('.seller-tracker-btn').forEach(btn => {
      btn.onclick = (e) => {
        const sellerId = btn.getAttribute('data-seller-id');
        const action = btn.getAttribute('data-action');
        const seller = this.sellerData[sellerId];
        if (!seller) return;
        if (action === 'good') {
          this.markSeller(sellerId, 'good', seller.name);
        } else if (action === 'bad') {
          this.markSeller(sellerId, 'bad', seller.name);
        } else if (action === 'note') {
          this.addNote(sellerId, seller.name);
        }
      };
    });
  }

  // 獲取狀態文字
  getStatusText(status) {
    switch (status) {
      case 'good': return '👍 好評';
      case 'bad': return '👎 避開';
      case 'neutral': return '📝 備註';
      default: return '未知';
    }
  }

  // 綁定事件
  bindEvents() {
    // 匯出數據
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportData();
    });

    // 清除全部數據
    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearAllData();
    });
  }

  // 匯出數據
  exportData() {
    const dataStr = JSON.stringify(this.sellerData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `蝦皮賣家記錄_${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    this.showMessage('數據匯出成功！');
  }

  // 清除全部數據
  async clearAllData() {
    if (confirm('確定要清除所有賣家記錄嗎？此操作無法復原。')) {
      try {
        await chrome.storage.sync.remove(['sellerData']);
        this.sellerData = {};
        this.renderStats();
        this.renderSellerList();
        this.showMessage('已清除所有記錄');
      } catch (error) {
        console.error('清除數據失敗:', error);
        this.showMessage('清除失敗，請重試');
      }
    }
  }

  // 顯示消息
  showMessage(message) {
    // 創建臨時消息提示
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
    `;
    msgDiv.textContent = message;
    
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
      document.body.removeChild(msgDiv);
    }, 2000);
  }

  // 新增 markSeller 及 addNote 方法到 PopupManager
  async markSeller(sellerId, status, sellerName) {
    try {
      const result = await chrome.storage.sync.get(['sellerData']);
      const sellerData = result.sellerData || {};
      sellerData[sellerId] = {
        name: sellerName,
        status: status,
        timestamp: Date.now(),
        note: sellerData[sellerId]?.note || ''
      };
      await chrome.storage.sync.set({ sellerData });
      await this.loadData();
      this.renderStats();
      this.renderSellerList();
      this.showMessage(`已標記 ${sellerName} 為 ${status === 'good' ? '好評' : '避開'}`);
    } catch (error) {
      this.showMessage('標記失敗');
    }
  }

  async addNote(sellerId, sellerName) {
    const note = prompt('請輸入對此賣家的備註:');
    if (note !== null) {
      try {
        const result = await chrome.storage.sync.get(['sellerData']);
        const sellerData = result.sellerData || {};
        if (!sellerData[sellerId]) {
          sellerData[sellerId] = {
            name: sellerName,
            status: 'neutral',
            timestamp: Date.now()
          };
        }
        sellerData[sellerId].note = note;
        await chrome.storage.sync.set({ sellerData });
        await this.loadData();
        this.renderStats();
        this.renderSellerList();
        this.showMessage(`已為 ${sellerName} 添加備註`);
      } catch (error) {
        this.showMessage('添加備註失敗');
      }
    }
  }
}

// 監聽 content script 傳來的 sellerDataUpdated 訊息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'sellerDataUpdated') {
    if (window.popupManagerInstance) {
      window.popupManagerInstance.loadData().then(() => {
        window.popupManagerInstance.renderStats();
        window.popupManagerInstance.renderSellerList();
      });
    }
  }
});

// 初始化彈出窗口
document.addEventListener('DOMContentLoaded', async () => {
  if (window.popupManagerInstance) {
    await window.popupManagerInstance.loadData();
    window.popupManagerInstance.renderStats();
    window.popupManagerInstance.renderSellerList();
  } else {
    window.popupManagerInstance = new PopupManager();
  }
});