/*
 * Created on Thu Aug 22 2024
 *
 * Copyright (c) 2024 idealbye
 */
export function customAlert(message, callback, options = {}) {
  // 创建自定义 alert 对话框的 DOM 元素
  const alertOverlay = document.createElement("div");
  const alertBox = document.createElement("div");
  const alertMessage = document.createElement("p");
  const alertCloseButton = document.createElement("button");
  const alertCancelButton = document.createElement("button");

  // 为各个元素设置 ID
  alertOverlay.id = "sound-guardian-alert-overlay";
  alertBox.id = "sound-guardian-alert-box";
  alertMessage.id = "sound-guardian-alert-message";
  alertCloseButton.id = "sound-guardian-alert-close";
  alertCancelButton.id = "sound-guardian-alert-cancel";

  // 设置消息内容和按钮文本
  alertMessage.textContent = message;
  alertCloseButton.textContent = chrome.i18n.getMessage("confirmButton");
  alertCancelButton.textContent = chrome.i18n.getMessage("cancelButton");

  // 将消息和按钮添加到 alert 对话框中
  alertBox.appendChild(alertMessage);
  alertBox.appendChild(alertCloseButton);

  // 如果需要显示取消按钮，则添加取消按钮
  if (options.showCancelButton) {
    alertBox.appendChild(alertCancelButton);
  }

  // 如果需要显示关闭图标，则创建并添加关闭图标
  if (options.showCloseIcon) {
    const closeIcon = document.createElement("span");
    closeIcon.textContent = "×";
    closeIcon.style.position = "absolute";
    closeIcon.style.top = "10px";
    closeIcon.style.right = "10px";
    closeIcon.style.cursor = "pointer";
    closeIcon.addEventListener("click", () => {
      alertOverlay.style.display = "none";
      alertOverlay.remove();
    });
    alertBox.appendChild(closeIcon);
  }

  // 将 alert 对话框添加到页面上
  alertOverlay.appendChild(alertBox);
  document.body.appendChild(alertOverlay);

  alertOverlay.style.display = "block";

  // 设置焦点到 alertOverlay 上，以便监听键盘事件
  alertOverlay.tabIndex = -1; // 确保 alertOverlay 可被聚焦
  alertOverlay.focus();

  // 确认按钮点击事件
  alertCloseButton.addEventListener("click", () => {
    alertOverlay.style.display = "none";
    alertOverlay.remove();
    if (callback) callback(true); // 调用回调函数，表示确认
  });

  // 取消按钮点击事件
  alertCancelButton.addEventListener("click", () => {
    alertOverlay.style.display = "none";
    alertOverlay.remove();
    if (callback) callback(false); // 调用回调函数，表示取消
  });

  // 点击遮罩层关闭对话框
  alertOverlay.addEventListener("click", (event) => {
    if (event.target === alertOverlay) {
      alertOverlay.style.display = "none";
      alertOverlay.remove();
      if (callback) callback(false); // 处理为取消操作
    }
  });

  // 阻止回车键的默认行为
  alertOverlay.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      alertCloseButton.click(); // 模拟点击确认按钮
    }
  });
}

export function customPrompt(message, callback, defaultValue = "") {
  // 创建自定义 prompt 对话框的 DOM 元素
  const promptOverlay = document.createElement("div");
  const promptBox = document.createElement("div");
  const promptMessage = document.createElement("p");
  const promptInput = document.createElement("input");
  const promptButtonContainer = document.createElement("div");
  const promptConfirmButton = document.createElement("button");
  const promptCancelButton = document.createElement("button");
  const errorMessage = document.createElement("div");

  // 为各个元素设置 ID
  promptOverlay.id = "sound-guardian-prompt-overlay";
  promptBox.id = "sound-guardian-prompt-box";
  promptMessage.id = "sound-guardian-prompt-message";
  promptInput.id = "sound-guardian-prompt-input";
  promptButtonContainer.id = "sound-guardian-prompt-button-container";
  promptConfirmButton.id = "sound-guardian-prompt-confirm";
  promptCancelButton.id = "sound-guardian-prompt-cancel";
  errorMessage.id = "sound-guardian-error-message";

  // 设置提示信息、输入框默认值、按钮文本
  promptMessage.textContent = message;
  promptInput.value = defaultValue;
  promptConfirmButton.textContent = chrome.i18n.getMessage("confirmButton");
  promptCancelButton.textContent = chrome.i18n.getMessage("cancelButton");

  // 设置错误消息的样式
  errorMessage.style.color = "red";
  errorMessage.style.fontSize = "12px";
  errorMessage.style.marginTop = "5px";
  errorMessage.style.display = "none";

  // 设置按钮容器的样式
  promptButtonContainer.style.display = "flex";
  promptButtonContainer.style.justifyContent = "center";
  promptButtonContainer.style.gap = "10px";

  // 将按钮添加到按钮容器中
  promptButtonContainer.appendChild(promptConfirmButton);
  promptButtonContainer.appendChild(promptCancelButton);

  // 将提示信息、输入框、错误消息和按钮容器添加到对话框中
  promptBox.appendChild(promptMessage);
  promptBox.appendChild(promptInput);
  promptBox.appendChild(errorMessage);
  promptBox.appendChild(promptButtonContainer);
  promptOverlay.appendChild(promptBox);
  document.body.appendChild(promptOverlay);

  promptOverlay.style.display = "block";

  // 确认按钮点击事件
  promptConfirmButton.addEventListener("click", () => {
    const value = promptInput.value.trim();

    // 验证输入值是否为空
    if (!value) {
      errorMessage.textContent = chrome.i18n.getMessage("emptyDomainError");
      errorMessage.style.display = "block";
    // 验证输入的 URL 格式是否正确
    } else if (!/^https?:\/\//.test(value)) {
      errorMessage.textContent = chrome.i18n.getMessage("invalidURLError");
      errorMessage.style.display = "block";
    } else {
      callback(value); // 调用回调函数，传递输入值
      promptOverlay.style.display = "none";
      promptOverlay.remove();
    }
  });

  // 取消按钮点击事件
  promptCancelButton.addEventListener("click", () => {
    promptOverlay.style.display = "none";
    promptOverlay.remove();
  });

  // 阻止回车键的默认行为
  promptOverlay.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      promptConfirmButton.click();
    }
  });

  // 自动聚焦到输入框
  promptInput.focus();
}
