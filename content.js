/*
 * Created on Thu Aug 22 2024
 *
 * Copyright (c) 2024 idealbye
 */
let clickSound; // 点击声音变量
let allowedDomains = []; // 允许的域名列表
let soundActivated = false; // 声音是否已激活的标志
let reminderDiv; // 提醒的 DOM 元素
let interactionCheckInterval; // 交互检查的间隔定时器
let notificationCount = 0; // 通知次数计数器
const maxNotificationCount = 10; // 最大通知次数

// 异步获取设置（点击声音和允许的域名）
const fetchSettings = async () => {
  try {
    const { clickSound, allowedDomains: domains } =
      await chrome.storage.sync.get(["clickSound", "allowedDomains"]);
    allowedDomains = domains || [];
    return { clickSound };
  } catch (error) {
    console.error(getMessage("fetchSettingsError") + ":", error);
    throw error;
  }
};

// 检查当前 URL 是否在允许的域名列表中
const isUrlAllowed = () => {
  const currentUrl = window.location.href.replace(/\/$/, "");
  return allowedDomains.some(
    (domain) => domain.enabled && domain.url.replace(/\/$/, "") === currentUrl
  );
};

// 获取本地化消息
const getMessage = (key) => chrome.i18n.getMessage(key);

// 播放指定的声音
const playSound = (sound) => {
  sound
    ?.play()
    .catch((error) => console.log(getMessage("playSoundError") + ":", error));
};

// 播放点击声音
const playClickSound = () => playSound(clickSound);

// 显示激活提示信息
const showActivationMessage = () => {
  const messageDiv = document.createElement("div");
  messageDiv.textContent = getMessage(
    soundActivated ? "activationMessageActive" : "activationMessageInactive"
  );
  Object.assign(messageDiv.style, {
    position: "fixed",
    top: "10px",
    left: "10px",
    backgroundColor: soundActivated
      ? "rgba(0, 128, 0, 0.8)" // 如果激活则显示绿色背景
      : "rgba(255, 0, 0, 0.8)", // 如果未激活则显示红色背景
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    zIndex: "10000",
    fontSize: "12px",
    width: "150px", // 固定宽度确保背景色一致
    textAlign: "center", // 使文本居中对齐
  });
  document.body.appendChild(messageDiv);
  return messageDiv;
};

// 显示交互提醒
const showInteractionReminder = () => {
  if (!reminderDiv) {
    reminderDiv = document.createElement("div");
    reminderDiv.textContent = getMessage("interactionReminder");
    Object.assign(reminderDiv.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "rgba(255, 0, 0, 0.8)", // 红色半透明背景
      color: "white",
      padding: "20px",
      borderRadius: "10px",
      zIndex: "10000",
      cursor: "pointer",
    });

    // 当用户点击提醒时，激活声音
    reminderDiv.addEventListener("click", (event) => {
      event.stopPropagation();
      activateSound();
    });

    document.body.appendChild(reminderDiv);
  }
};

// 处理文档点击事件
const handleDocumentClick = () => {
  if (!soundActivated) activateSound(); // 如果声音未激活，则激活
  if (reminderDiv) {
    reminderDiv.remove();
    reminderDiv = null;
  }

  clearInterval(interactionCheckInterval); // 清除交互检查定时器
  interactionCheckInterval = null;

  stopTitleFlashing(); // 停止标题闪烁
};

// 启用声音功能
const enableSound = async () => {
  if (!clickSound) {
    const { clickSound: sound } = await fetchSettings();
    clickSound = new Audio(
      chrome.runtime.getURL(sound || "sounds/defaultClick.wav")
    );
  }
  playClickSound();
};

// 激活声音
const activateSound = async () => {
  if (!soundActivated) {
    await enableSound();
    soundActivated = true;
    const activationMessageDiv = showActivationMessage();
    activationMessageDiv.style.backgroundColor = "green"; // 激活后显示绿色背景

    if (reminderDiv) {
      reminderDiv.remove();
      reminderDiv = null;
    }

    clearInterval(interactionCheckInterval); // 清除交互检查定时器
    interactionCheckInterval = null;

    stopTitleFlashing(); // 停止标题闪烁
  }
};

// 开始交互检查定时器
const startInteractionCheck = () => {
  interactionCheckInterval = setInterval(() => {
    if (!soundActivated && reminderDiv) {
      chrome.runtime.sendMessage({ action: "activateTab" });

      startTitleFlashing(); // 开始标题闪烁

      if (notificationCount < maxNotificationCount) {
        chrome.runtime.sendMessage({ action: "showNotification" });
        notificationCount++; // 增加通知次数
        playClickSound(); // 每次都会播放点击声音
      }
    }
  }, 3000);
};


// 初始化函数
const initialize = async () => {
  try {
    const currentURL = window.location.href;

    // 跳过 Chrome 内部页面的脚本注入
    if (
      currentURL.startsWith("chrome://") ||
      currentURL.startsWith("chrome-extension://")
    ) {
      console.log("Skipping script injection for Chrome internal pages.");
      return;
    }

    const settings = await fetchSettings();
    if (isUrlAllowed()) {
      clickSound = new Audio(chrome.runtime.getURL(settings.clickSound));
      showActivationMessage();
      document.addEventListener("click", handleDocumentClick);
      showInteractionReminder();
      startInteractionCheck();
    }
  } catch (error) {
    console.error(getMessage("initializationFailed") + ":", error);
  }
};

initialize();

let originalTitle = document.title; // 原始页面标题
let alertTitle = "⚠️ Action Needed!"; // 警告标题
let titleInterval;

// 开始标题闪烁
const startTitleFlashing = () => {
  if (!titleInterval) {
    titleInterval = setInterval(() => {
      document.title =
        document.title === originalTitle ? alertTitle : originalTitle;
    }, 1000);
  }
};

// 停止标题闪烁
const stopTitleFlashing = () => {
  clearInterval(titleInterval);
  titleInterval = null;
  document.title = originalTitle; // 恢复原始标题
};

// 监听来自 background.js 的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "activateSound") {
    activateSound();
  }
});
