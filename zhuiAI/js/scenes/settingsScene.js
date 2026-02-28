/**
 * 设置场景
 */
const config = require('../config');
const UI = require('../ui/ui');

class SettingsScene {
  constructor(canvas, ctx, systemInfo, sceneManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.w = systemInfo.windowWidth;
    this.h = systemInfo.windowHeight;
    this.sceneManager = sceneManager;
    this.backBtn = { x: 10, y: 10, w: 60, h: 36 };
    this.settings = {
      sound: true,
    };
    this.items = [];
  }

  onEnter() {
    // 加载设置
    try {
      const saved = tt.getStorageSync('settings');
      if (saved) {
        this.settings = { ...this.settings, ...saved };
      }
    } catch (e) {
      // ignore
    }

    this._setupItems();
    this.render();
  }

  _setupItems() {
    const w = this.w;
    const startY = 80;
    const itemH = 56;
    const margin = 16;
    const itemW = w - margin * 2;

    this.items = [
      { y: startY, h: itemH, label: '🔊 音效', type: 'toggle', key: 'sound' },
      { y: startY + itemH + 8, h: itemH, label: '🗑️ 清除缓存', type: 'action', action: 'clearCache' },
      { y: startY + (itemH + 8) * 2, h: itemH, label: '📖 关于游戏', type: 'action', action: 'about' },
      { y: startY + (itemH + 8) * 3, h: itemH, label: '🔄 重新选择性别', type: 'action', action: 'resetGender' },
    ];
  }

  onTouchEnd(e) {
    const touch = e.changedTouches[0];
    const margin = 16;
    const itemW = this.w - margin * 2;

    // 返回按钮
    if (UI.isInRect(touch, this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h)) {
      this.sceneManager.switchTo('chat');
      return;
    }

    // 菜单项
    for (const item of this.items) {
      if (UI.isInRect(touch, margin, item.y, itemW, item.h)) {
        this._handleItemClick(item);
        return;
      }
    }
  }

  _handleItemClick(item) {
    if (item.type === 'toggle') {
      this.settings[item.key] = !this.settings[item.key];
      this._saveSettings();
      this.render();
    } else if (item.type === 'action') {
      switch (item.action) {
        case 'clearCache':
          this._clearCache();
          break;
        case 'about':
          this._showAbout();
          break;
        case 'resetGender':
          this._resetGender();
          break;
      }
    }
  }

  _saveSettings() {
    try {
      tt.setStorageSync('settings', this.settings);
    } catch (e) {
      // ignore
    }
  }

  _clearCache() {
    try {
      tt.clearStorageSync();
      this._showToast('缓存已清除');
    } catch (e) {
      // ignore
    }
  }

  _showAbout() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    UI.drawOverlay(ctx, w, h, 0.5);

    const dlgW = w * 0.8;
    const dlgH = 240;
    const dlgX = (w - dlgW) / 2;
    const dlgY = (h - dlgH) / 2;

    UI.drawCard(ctx, dlgX, dlgY, dlgW, dlgH, { shadow: true, radius: 20, bgColor: config.THEME.white });

    ctx.fillStyle = config.THEME.text;
    ctx.font = `bold 18px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('这些年我们追过的AI恋人', dlgX + dlgW / 2, dlgY + 35);

    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `13px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('版本 1.0.0', dlgX + dlgW / 2, dlgY + 65);
    ctx.fillText('AI互动恋爱养成游戏', dlgX + dlgW / 2, dlgY + 90);
    ctx.fillText('对话驱动剧情发展', dlgX + dlgW / 2, dlgY + 115);
    ctx.fillText('从陌生人到白头偕老', dlgX + dlgW / 2, dlgY + 140);

    ctx.font = `12px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('点击任意位置关闭', dlgX + dlgW / 2, dlgY + dlgH - 25);
  }

  _resetGender() {
    try {
      tt.clearStorageSync();
    } catch (e) {
      // ignore
    }
    const dataManager = require('../managers/dataManager');
    dataManager.playerData = null;
    dataManager.loverProgress = null;
    dataManager.chatMessages = [];
    this.sceneManager.switchTo('gender');
  }

  _showToast(msg) {
    if (typeof tt.showToast === 'function') {
      tt.showToast({ title: msg, icon: 'success' });
    }
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const margin = 16;
    const itemW = w - margin * 2;

    // 背景
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, w, h);

    // 顶部栏
    ctx.fillStyle = config.THEME.white;
    ctx.fillRect(0, 0, w, 56);
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, 56);
    ctx.lineTo(w, 56);
    ctx.stroke();

    // 返回按钮
    ctx.fillStyle = config.THEME.text;
    ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('← 返回', this.backBtn.x + 8, this.backBtn.y + this.backBtn.h / 2);

    // 标题
    ctx.fillStyle = config.THEME.text;
    ctx.font = `bold 17px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('设置', w / 2, 28);

    // 设置项
    for (const item of this.items) {
      UI.drawCard(ctx, margin, item.y, itemW, item.h, { radius: 12, bgColor: config.THEME.white });

      ctx.fillStyle = config.THEME.text;
      ctx.font = `15px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, margin + 16, item.y + item.h / 2);

      if (item.type === 'toggle') {
        // 开关
        const toggleX = margin + itemW - 60;
        const toggleY = item.y + item.h / 2 - 12;
        const isOn = this.settings[item.key];

        UI.fillRoundRect(ctx, toggleX, toggleY, 48, 24, 12, isOn ? config.THEME.success : '#D0D0D0');
        ctx.beginPath();
        ctx.arc(isOn ? toggleX + 36 : toggleX + 12, toggleY + 12, 10, 0, Math.PI * 2);
        ctx.fillStyle = config.THEME.white;
        ctx.fill();
      } else {
        // 箭头
        ctx.fillStyle = config.THEME.textLight;
        ctx.font = `16px Arial`;
        ctx.textAlign = 'right';
        ctx.fillText('›', margin + itemW - 16, item.y + item.h / 2);
      }
    }
  }
}

module.exports = SettingsScene;
