// 彈出窗口管理
class PopupManager {
  constructor() {
    this.sellerData = {};
    this.init();
    
    // 監聽 storage 變化，自動刷新
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.sellerData) {
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
      const result = await chrome.storage.local.get(['sellerData']);
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
      <div class="seller-item">
        <div class="seller-name" title="${data.name}${data.note ? '\n備註: ' + data.note : ''}">
          ${data.name}
          ${data.note ? '📝' : ''}
        </div>
        <div class="seller-status status-${data.status}">
          ${this.getStatusText(data.status)}
        </div>
      </div>
    `).join('');
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
        await chrome.storage.local.remove(['sellerData']);
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
}

// 初始化彈出窗口
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});