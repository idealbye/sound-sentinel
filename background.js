/*
 * Created on Thu Aug 22 2024
 *
 * Copyright (c) 2024 idealbye
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSoundFiles") {
    // 从 sounds.json 文件中获取声音文件列表
    fetch(chrome.runtime.getURL("sounds.json"))
      .then((response) => response.json())
      .then((data) => {
        console.log("Sound files fetched in background.js:", data); // 添加调试输出
        sendResponse(data);
      })
      .catch((error) => {
        console.error("Error fetching sound files in background.js:", error);
        sendResponse({ sounds: [] });
      });
    return true; // 保持消息通道打开以进行异步响应
  }

  if (message.action === "activateTab") {
    // 激活发送消息的标签页
    if (sender && sender.tab && sender.tab.id) {
      chrome.tabs.update(sender.tab.id, { active: true }, () => {
        if (chrome.runtime.lastError) {
          console.error("无法激活标签页:", chrome.runtime.lastError.message);
        }
      });
    } else {
      console.error("无法激活标签页：找不到标签页 ID");
    }
  }

  if (message.action === "showNotification") {
    // 显示系统通知，提醒用户点击页面以激活声音通知
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Action Required",
      message: "Click the page to activate sound notifications.",
      priority: 2,
    });
  }
});

// 监听通知点击事件
chrome.notifications.onClicked.addListener((notificationId) => {
  // 获取当前活动的标签页
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTab = tabs[0];
      // 发送消息给内容脚本，要求激活声音
      chrome.tabs.sendMessage(activeTab.id, { action: "activateSound" });
    }
  });

  // 清除通知
  chrome.notifications.clear(notificationId);
});
