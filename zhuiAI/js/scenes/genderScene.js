/**
 * 性别选择场景
 */
const config = require('../config');
const UI = require('../ui/ui');
const dataManager = require('../managers/dataManager');

class GenderScene {
  constructor(canvas, ctx, systemInfo, sceneManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.w = systemInfo.windowWidth;
    this.h = systemInfo.windowHeight;
    this.sceneManager = sceneManager;
    this.buttons = [];
  }

  onEnter() {
    this._setupButtons();
    this.render();
  }

  _setupButtons() {
    const w = this.w;
    const h = this.h;
    const btnW = w * 0.35;
    const btnH = 140;
    const gap = 20;
    const startX = (w - btnW * 2 - gap) / 2;
    const startY = h * 0.45;

    this.buttons = [
      {
        x: startX, y: startY, w: btnW, h: btnH,
        gender: 'male', label: '我是男生', emoji: '🧑', color: '#4A90D9',
      },
      {
        x: startX + btnW + gap, y: startY, w: btnW, h: btnH,
        gender: 'female', label: '我是女生', emoji: '👩', color: '#FF6B9D',
      },
    ];
  }

  onTouchEnd(e) {
    const touch = e.changedTouches[0];
    for (const btn of this.buttons) {
      if (UI.isInRect(touch, btn.x, btn.y, btn.w, btn.h)) {
        this._selectGender(btn.gender);
        return;
      }
    }
  }

  async _selectGender(gender) {
    this.ctx.fillStyle = config.THEME.overlay;
    this.ctx.fillRect(0, 0, this.w, this.h);
    this.ctx.fillStyle = config.THEME.white;
    this.ctx.font = `16px "PingFang SC", "Microsoft YaHei", sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('正在初始化...', this.w / 2, this.h / 2);

    try {
      await dataManager.initPlayer(gender);
      dataManager.saveToStorage();
      this.sceneManager.switchTo('loverSelect', { gender });
    } catch (err) {
      console.error('初始化玩家失败:', err);
      // 离线模式 - 使用本地数据
      dataManager.playerData = {
        gender: gender,
        word_balance: config.WORD_ECONOMY.INITIAL_GIFT,
        daily_ad_count: 0,
        consecutive_login: 1,
        current_lover_id: null,
      };
      dataManager.saveToStorage();
      this.sceneManager.switchTo('loverSelect', { gender });
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#FFF5F7');
    gradient.addColorStop(1, '#FFE0EB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // 标题
    ctx.fillStyle = config.THEME.text;
    ctx.font = `bold ${w / 16}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('选择你的性别', w / 2, h * 0.15);

    // 副标题
    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('这将决定你的恋人候选列表', w / 2, h * 0.22);

    // 装饰
    ctx.font = `${w / 6}px Arial`;
    ctx.fillText('💝', w / 2, h * 0.33);

    // 性别选择按钮
    for (const btn of this.buttons) {
      // 卡片背景
      UI.drawCard(ctx, btn.x, btn.y, btn.w, btn.h, {
        shadow: true,
        bgColor: config.THEME.white,
        radius: 20,
      });

      // Emoji
      ctx.font = `${btn.w / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.emoji, btn.x + btn.w / 2, btn.y + btn.h * 0.38);

      // 文字
      ctx.fillStyle = btn.color;
      ctx.font = `bold 16px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h * 0.75);
    }

    // 底部提示
    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `12px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('选择后将展示异性恋人供你选择', w / 2, h * 0.85);
  }
}

module.exports = GenderScene;
