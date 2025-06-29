// 蝦皮賣家記錄器 - 內容腳本
class ShopeeSellerTracker {
  constructor() {
    this.init();
  }

  init() {
    console.log('🚀 蝦皮賣家記錄器已啟動');
    console.log('📍 當前頁面:', window.location.href);
    
    // 延遲執行，確保頁面載入完成
    setTimeout(() => {
      this.addSellerButtons();
      this.checkSellerStatus();
    }, 3000);
    
    this.observePageChanges();
  }

  // 獲取當前賣家資訊（根據網址判斷頁面類型）
  getSellerInfo() {
    const isCartPage = window.location.pathname === '/cart/';
    if (isCartPage) {
      console.log('🔍 開始搜尋購物車賣家資訊...');
      const cartSellerLinks = document.querySelectorAll('a.QcqMX5');
      if (cartSellerLinks.length > 0) {
        const sellers = Array.from(cartSellerLinks).map(link => {
          const name = link.querySelector('span')?.textContent?.trim() || link.textContent.trim();
          const href = link.getAttribute('href') || '';
          const urlParams = new URLSearchParams(href.split('?')[1]);
          const itemId = urlParams.get('itemId') || '';
          const sellerId = href.split('?')[0].replace('/', '');
          // 取最外層的 cart-item 或 li 元素
          const element = link.closest('[class*="cart-item"], li') || link.parentElement;
          return {
            name,
            id: sellerId,
            url: href,
            itemId,
            element
          };
        }).filter(seller => seller.id && seller.name && seller.itemId && seller.element);
        if (sellers.length > 0) {
          console.log('✅ 找到購物車賣家:', sellers);
          return sellers;
        }
      }
      console.log('❌ 未找到購物車賣家資訊');
      return null;
    }
    // 商品頁面
    const sellerNameDiv = document.querySelector('.fV3TIn');
    const sellerLink = document.querySelector('a.lG5Xxv, a.Z6yFUs');
    if (sellerNameDiv && sellerLink) {
      const sellerName = sellerNameDiv.textContent.trim();
      const href = sellerLink.getAttribute('href');
      const sellerId = this.extractSellerIdFromUrl(href);
      return {
        name: sellerName,
        id: sellerId,
        url: href,
        element: sellerNameDiv
      };
    }
    return null;
  }

  // 從URL提取賣家ID
  extractSellerIdFromUrl(url) {
    // 先抓 /shop/123456
    let match = url.match(/shop\/(\d+)/);
    if (match) return match[1];
    // 再抓 /賣家帳號
    match = url.match(/^\/([^/?#]+)/);
    if (match) return match[1];
    return null;
  }

  // 添加賣家操作按鈕
  addSellerButtons() {
    const sellerInfo = this.getSellerInfo();
    
    if (Array.isArray(sellerInfo)) {
      // 搜尋結果頁面
      sellerInfo.forEach(seller => {
        if (seller.element) {
          this.addButtonToSearchItem(seller);
        }
      });
    } else if (sellerInfo && sellerInfo.element) {
      // 商品頁面
      this.addButtonToProductPage(sellerInfo);
    }
  }

  // 在搜尋結果項目添加按鈕
  addButtonToSearchItem(seller) {
    if (!seller.element || seller.element.querySelector('.seller-tracker-btn')) return;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'seller-tracker-container';
    btnContainer.innerHTML = `
      <button class="seller-tracker-btn good" data-seller-id="${seller.id}" data-action="good">
        👍 好評
      </button>
      <button class="seller-tracker-btn bad" data-seller-id="${seller.id}" data-action="bad">
        👎 避開
      </button>
    `;

    // 多個可能的插入位置
    const insertTargets = [
      '.shopee-search-item-result__item-price',
      '.item-price',
      '.price-section',
      '.item-info',
      '.product-info',
      // 如果找不到價格區域，嘗試其他位置
      '.item-content',
      '.item-detail'
    ];

    let inserted = false;
    for (const selector of insertTargets) {
      const target = seller.element.querySelector(selector);
      if (target) {
        target.appendChild(btnContainer);
        console.log(`✅ 搜尋項目按鈕已插入到: ${selector}`);
        inserted = true;
        break;
      }
    }

    // 如果都找不到，就直接加到商品元素的最後
    if (!inserted) {
      seller.element.appendChild(btnContainer);
      console.log('✅ 搜尋項目按鈕已插入到商品元素末尾');
    }

    this.attachButtonEvents(btnContainer, seller);
  }

  // 在商品頁面添加按鈕
  addButtonToProductPage(seller) {
    // 避免重複插入
    if (seller.element.querySelector('.seller-tracker-btn')) return;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'seller-tracker-container';
    btnContainer.innerHTML = `
      <button class="seller-tracker-btn good" data-seller-id="${seller.id}" data-action="good">👍 好評</button>
      <button class="seller-tracker-btn bad" data-seller-id="${seller.id}" data-action="bad">👎 避開</button>
      <button class="seller-tracker-btn note" data-seller-id="${seller.id}" data-action="note">📝 備註</button>
    `;

    this.attachButtonEvents(btnContainer, seller);

    seller.element.appendChild(btnContainer);
  }

  // 綁定按鈕事件
  attachButtonEvents(container, seller) {
    const buttons = container.querySelectorAll('.seller-tracker-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleButtonClick(btn, seller);
      });
    });
  }

  // 處理按鈕點擊
  handleButtonClick(btn, seller) {
    const action = btn.dataset.action;
    const sellerId = btn.dataset.sellerId;

    switch (action) {
      case 'good':
        this.markSeller(sellerId, 'good', seller.name);
        break;
      case 'bad':
        this.markSeller(sellerId, 'bad', seller.name);
        break;
      case 'note':
        this.addNote(sellerId, seller.name);
        break;
    }
  }

  // 標記賣家
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
      
      // 通知 popup 重新載入，忽略錯誤訊息
      chrome.runtime.sendMessage({ type: 'sellerDataUpdated' }, () => {
        if (chrome.runtime.lastError) {
          // 忽略錯誤，不顯示
        }
      });
      
      this.showNotification(`已標記 ${sellerName} 為 ${status === 'good' ? '好評' : '避開'}`);
      this.updateSellerStatus();
    } catch (error) {
      console.error('標記賣家失敗:', error);
    }
  }

  // 添加備註
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
        
        this.showNotification(`已為 ${sellerName} 添加備註`);
      } catch (error) {
        console.error('添加備註失敗:', error);
      }
    }
  }

  // 檢查並顯示賣家狀態
  async checkSellerStatus() {
    try {
      const result = await chrome.storage.sync.get(['sellerData']);
      const sellerData = result.sellerData || {};
      
      const sellerInfo = this.getSellerInfo();  // 移除await因為不是async函數
      if (!sellerInfo) {
        console.log('無法獲取賣家資訊');
        return;
      }
      
      // 處理購物車或搜尋結果頁面
      if (Array.isArray(sellerInfo)) {
        sellerInfo.forEach(seller => {
          if (seller.id && sellerData[seller.id]) {
            const element = seller.element;
            if (element) {
              // 在商品卡片上顯示標記
              this.highlightSeller(element, sellerData[seller.id]);
            }
          }
        });
        return;
      }
      
      // 處理商品詳情頁面
      if (sellerInfo.id && sellerData[sellerInfo.id]) {
        // 顯示全頁警告
        this.showSellerWarning(sellerData[sellerInfo.id]);
        // 在商家資訊區域顯示標記
        const shopSection = document.querySelector('.page-product__shop');
        if (shopSection) {
          this.highlightSeller(shopSection, sellerData[sellerInfo.id]);
        }
        // 在賣家名稱區塊顯示標記（商品頁）
        if (sellerInfo.element) {
          this.highlightSeller(sellerInfo.element, sellerData[sellerInfo.id]);
        }
      }
    } catch (error) {
      console.error('檢查賣家狀態失敗:', error);
    }
  }

  // 高亮顯示賣家狀態
  highlightSeller(element, data) {
    if (!element) return;

    element.classList.add(`seller-status-${data.status}`);

    // 先移除舊的標籤避免重複
    const oldWarning = element.querySelector('.seller-warning');
    if (oldWarning) oldWarning.remove();
    const oldBadge = element.querySelector('.seller-good-badge');
    if (oldBadge) oldBadge.remove();

    // 商品頁面賣家名稱區塊（.fV3TIn）直接在後方插入標記
    if (element.classList.contains('fV3TIn')) {
      // 移除同層的舊標記
      let next = element.nextElementSibling;
      while (next && (next.classList.contains('seller-warning') || next.classList.contains('seller-good-badge'))) {
        const toRemove = next;
        next = next.nextElementSibling;
        toRemove.remove();
      }
      if (data.status === 'bad') {
        const warning = document.createElement('span');
        warning.className = 'seller-warning';
        warning.innerHTML = `⚠️ 已標記為避開 ${data.note ? `(${data.note})` : ''}`;
        element.after(warning);
      } else if (data.status === 'good') {
        const badge = document.createElement('span');
        badge.className = 'seller-good-badge';
        badge.innerHTML = `✅ 好評賣家`;
        element.after(badge);
      }
      return;
    }

    // 其他情境維持原本行為
    const nameNode = element.querySelector('span, .seller-name, .shop-name, .fV3TIn');
    let insertTarget = nameNode || element;

    if (data.status === 'bad') {
      const warning = document.createElement('span');
      warning.className = 'seller-warning';
      warning.innerHTML = `⚠️ 已標記為避開 ${data.note ? `(${data.note})` : ''}`;
      insertTarget.appendChild(warning);
    } else if (data.status === 'good') {
      const badge = document.createElement('span');
      badge.className = 'seller-good-badge';
      badge.innerHTML = `✅ 好評賣家`;
      insertTarget.appendChild(badge);
    }
  }

  // 顯示賣家警告
  showSellerWarning(data) {
    if (data.status === 'bad') {
      // 先移除舊的警告框
      const oldWarning = document.querySelector('.seller-page-warning');
      if (oldWarning) oldWarning.remove();
      const warning = document.createElement('div');
      warning.className = 'seller-page-warning';
      warning.innerHTML = `
        <div class="warning-content">
          ⚠️ <strong>注意：此賣家已被標記為避開</strong>
          ${data.note ? `<br>備註：${data.note}` : ''}
          <br>標記時間：${new Date(data.timestamp).toLocaleString()}
        </div>
      `;
      document.body.insertBefore(warning, document.body.firstChild);
      // 5 秒後自動淡出並移除
      setTimeout(() => {
        warning.style.transition = 'opacity 0.8s';
        warning.style.opacity = '0';
        setTimeout(() => warning.remove(), 800);
      }, 5000);
    }
  }

  // 顯示通知
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'seller-tracker-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // 監聽頁面變化
  observePageChanges() {
    const isCartPage = window.location.pathname === '/cart/';
    if (!isCartPage) return; // 只在購物車頁啟用 observer
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.addSellerButtons();
        this.checkSellerStatus();
      }, 3000); // 3 秒
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// 頁面載入完成後初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ShopeeSellerTracker();
  });
} else {
  new ShopeeSellerTracker();
}