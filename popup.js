/*
 * Created on Thu Aug 22 2024
 *
 * Copyright (c) 2024 idealbye
 */
import { customAlert, customPrompt } from "./customDialogs.js";

document.addEventListener("DOMContentLoaded", async () => {
  const clickSoundSelect = document.getElementById(
    "sound-guardian-clickSoundSelect"
  ); // 获取点击声音选择元素
  const saveButton = document.getElementById("sound-guardian-saveButton"); // 获取保存按钮元素
  const previewClickButton = document.getElementById(
    "sound-guardian-previewClickButton"
  ); // 获取预览声音按钮元素
  const domainList = document.getElementById("sound-guardian-domainList"); // 获取域名列表元素
  const addDomainButton = document.getElementById(
    "sound-guardian-addDomainButton"
  ); // 获取添加域名按钮元素

  let previewClickSound; // 预览点击声音的变量

  // 从后台脚本获取声音文件
  const fetchSoundFiles = () => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: "getSoundFiles" }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  };

  // 加载保存的设置
  const loadSettings = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["clickSound", "allowedDomains"], (data) => {
        resolve(data);
      });
    });
  };

  // 保存设置
  const saveSettings = (clickSound, domains) => {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ clickSound, allowedDomains: domains }, () => {
        resolve();
      });
    });
  };

  // 将声音文件列表填充到声音选择框中
  const populateSoundSelect = (sounds, soundSelect) => {
    sounds.forEach((sound) => {
      const option = document.createElement("option");
      option.value = sound.file;
      option.textContent = sound.name;
      soundSelect.appendChild(option);
    });
  };

  // 初始化设置
  const initSettings = async () => {
    try {
      const data = await fetchSoundFiles();
      populateSoundSelect(data.sounds, clickSoundSelect);

      const settings = await loadSettings();
      clickSoundSelect.value = settings.clickSound || data.defaultClickSound;
    } catch (error) {
      console.error("初始化失败:", error);
    }
  };

  // 加载国际化消息
  const loadI18nMessages = () => {
    document.querySelectorAll("[data-i18n]").forEach((elem) => {
      const key = elem.getAttribute("data-i18n");
      const message = chrome.i18n.getMessage(key);
      if (message) {
        elem.textContent = message;
      }
    });
  };

  // 显示操作成功消息
  const showOperationSuccessMessage = () => {
    customAlert(chrome.i18n.getMessage("settingsSaved"));
  };

  // 加载允许的域名列表
  const loadAllowedDomains = () => {
    chrome.storage.sync.get(["allowedDomains"], (data) => {
      let domains = data.allowedDomains || [];
      domainList.innerHTML = "";

      // 如果没有域名，显示空消息
      if (domains.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = chrome.i18n.getMessage("noDomainsMessage");
        emptyMessage.className = "sound-guardian-empty-message";
        emptyMessage.style.textAlign = "center";
        emptyMessage.style.margin = "20px 0";
        domainList.appendChild(emptyMessage);
      } else {
        domains
          .slice()
          .reverse()
          .forEach((domainObj) => {
            const listItem = createDomainListItem(domainObj, domains);
            domainList.appendChild(listItem);
          });
      }
    });
  };

  // 创建域名列表项
  const createDomainListItem = (domainObj, domains) => {
    const { url, enabled } = domainObj;
    const listItem = document.createElement("li");
    listItem.className = "sound-guardian-domain-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabled;
    checkbox.addEventListener("change", () => {
      domainObj.enabled = checkbox.checked;
      chrome.storage.sync.set({ allowedDomains: domains }, showOperationSuccessMessage);
    });

    const label = document.createElement("label");
    label.textContent = url;
    label.title = url;
    label.style.whiteSpace = "nowrap";
    label.style.overflow = "hidden";
    label.style.textOverflow = "ellipsis";

    label.addEventListener("click", () => {
      checkbox.checked = !checkbox.checked;
      const event = new Event("change");
      checkbox.dispatchEvent(event);
    });

    const editLink = document.createElement("a");
    editLink.href = "#";
    editLink.textContent = chrome.i18n.getMessage("editLinkText");
    editLink.style.marginLeft = "10px";
    editLink.addEventListener("click", (e) => {
      e.preventDefault();
      customPrompt(
        chrome.i18n.getMessage("editDomainPrompt"),
        (newDomain) => {
          if (newDomain && newDomain !== url) {
            domainObj.url = newDomain;
            chrome.storage.sync.set({ allowedDomains: domains }, () => {
              loadAllowedDomains();
              showOperationSuccessMessage();
            });
          }
        },
        url
      );
    });

    const deleteLink = document.createElement("a");
    deleteLink.href = "#";
    deleteLink.textContent = chrome.i18n.getMessage("deleteLinkText");
    deleteLink.style.marginLeft = "10px";
    deleteLink.style.marginRight = "5px";
    deleteLink.style.color = "red";
    deleteLink.addEventListener("click", (e) => {
      e.preventDefault();
      const confirmMessage = chrome.i18n.getMessage("deleteDomainConfirm", [
        url,
      ]);

      customAlert(
        confirmMessage,
        (confirmed) => {
          if (confirmed) {
            const index = domains.indexOf(domainObj);
            if (index > -1) {
              domains.splice(index, 1);
            }
            chrome.storage.sync.set({ allowedDomains: domains }, () => {
              loadAllowedDomains();
              showOperationSuccessMessage();
            });
          }
        },
        { showCancelButton: true, showCloseIcon: true }
      );
    });

    listItem.appendChild(checkbox);
    listItem.appendChild(label);
    listItem.appendChild(editLink);
    listItem.appendChild(deleteLink);

    return listItem;
  };

  // 保存按钮点击事件
  saveButton.addEventListener("click", async () => {
    const clickSound = clickSoundSelect.value;

    try {
      const settings = await loadSettings();
      let domains = settings.allowedDomains || [];
      await saveSettings(clickSound, domains);
      showOperationSuccessMessage();
    } catch (error) {
      console.error("保存设置失败:", error);
    }
  });

  // 预览点击声音按钮点击事件
  previewClickButton.addEventListener("click", () => {
    const clickSound = clickSoundSelect.value;
    if (previewClickSound) {
      previewClickSound.pause();
    }
    previewClickSound = new Audio(chrome.runtime.getURL(clickSound));
    previewClickSound.play().catch((error) => {
      console.error("播放声音失败:", error);
    });
  });

  // 初始化并加载页面元素和设置
  loadI18nMessages();
  initSettings();
  loadAllowedDomains();

  // 添加域名按钮点击事件
  addDomainButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0] && tabs[0].url ? tabs[0].url : "";
      customPrompt(
        chrome.i18n.getMessage("addDomainPrompt"),
        (newDomain) => {
          const inputField = document.getElementById(
            "sound-guardian-prompt-input"
          );
          let errorMessage = document.getElementById(
            "sound-guardian-error-message"
          );

          if (!errorMessage) {
            errorMessage = document.createElement("div");
            errorMessage.id = "sound-guardian-error-message";
            errorMessage.style.color = "red";
            errorMessage.style.fontSize = "12px";
            errorMessage.style.marginTop = "5px";
            inputField.parentNode.insertBefore(
              errorMessage,
              inputField.nextSibling
            );
          }

          if (!newDomain) {
            errorMessage.textContent = chrome.i18n.getMessage(
              "emptyDomainError"
            );
          } else {
            errorMessage.textContent = "";
            chrome.storage.sync.get(["allowedDomains"], (data) => {
              let domains = data.allowedDomains || [];
              if (!domains.some((domain) => domain.url === newDomain)) {
                domains.push({ url: newDomain, enabled: true });
                chrome.storage.sync.set({ allowedDomains: domains }, () => {
                  loadAllowedDomains();
                  showOperationSuccessMessage();
                });
              }
            });
          }
        },
        currentUrl
      );
    });
  });
});
