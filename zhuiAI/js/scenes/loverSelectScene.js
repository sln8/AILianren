/**
 * 恋人选择场景 - 卡片式展示恋人候选列表
 */
const config = require('../config');
const UI = require('../ui/ui');
const dataManager = require('../managers/dataManager');

class LoverSelectScene {
  constructor(canvas, ctx, systemInfo, sceneManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.w = systemInfo.windowWidth;
    this.h = systemInfo.windowHeight;
    this.sceneManager = sceneManager;
    this.lovers = [];
    this.currentIndex = 0;
    this.touchStartX = 0;
    this.offsetX = 0;
    this.isAnimating = false;
    this.confirmBtn = null;
    this.gender = 'male';
  }

  onEnter(params) {
    this.gender = (params && params.gender) || 'male';
    this.lovers = config.getLoversForGender(this.gender);
    this.currentIndex = 0;
    this.offsetX = 0;
    this._setupConfirmButton();
    this.render();
  }

  _setupConfirmButton() {
    const btnW = this.w * 0.5;
    const btnH = 48;
    this.confirmBtn = {
      x: (this.w - btnW) / 2,
      y: this.h * 0.82,
      w: btnW,
      h: btnH,
    };
  }

  onTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
  }

  onTouchMove(e) {
    if (this.isAnimating) return;
    const dx = e.touches[0].clientX - this.touchStartX;
    this.offsetX = dx;
    this.render();
  }

  onTouchEnd(e) {
    const touch = e.changedTouches[0];

    // 检查确认按钮点击
    if (this.confirmBtn && UI.isInRect(touch, this.confirmBtn.x, this.confirmBtn.y, this.confirmBtn.w, this.confirmBtn.h)) {
      this._selectLover(this.lovers[this.currentIndex]);
      return;
    }

    // 处理滑动
    const dx = touch.clientX - this.touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && this.currentIndex < this.lovers.length - 1) {
        this.currentIndex++;
      } else if (dx > 0 && this.currentIndex > 0) {
        this.currentIndex--;
      }
    }
    this.offsetX = 0;
    this.render();
  }

  async _selectLover(lover) {
    // 显示加载
    this.ctx.fillStyle = config.THEME.overlay;
    this.ctx.fillRect(0, 0, this.w, this.h);
    this.ctx.fillStyle = config.THEME.white;
    this.ctx.font = `16px "PingFang SC", "Microsoft YaHei", sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`正在选择 ${lover.name}...`, this.w / 2, this.h / 2);

    try {
      await dataManager.selectLover(lover.id);
      dataManager.saveToStorage();
      this.sceneManager.switchTo('chat');
    } catch (err) {
      console.error('选择恋人失败:', err);
      // 离线模式
      dataManager.playerData.current_lover_id = lover.id;
      dataManager.loverProgress = {
        lover_id: lover.id,
        favor: 0,
        stage: 0,
        stage_round_count: 0,
        total_rounds: 0,
        status: 'active',
        events_triggered: [],
      };
      dataManager.saveToStorage();
      this.sceneManager.switchTo('chat');
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
    ctx.font = `bold ${w / 18}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('选择你的恋人', w / 2, h * 0.06);

    // 副标题
    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `12px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('左右滑动浏览，点击下方按钮确认', w / 2, h * 0.1);

    // 卡片
    const cardW = w * 0.75;
    const cardH = h * 0.58;
    const cardX = (w - cardW) / 2 + this.offsetX;
    const cardY = h * 0.14;

    const lover = this.lovers[this.currentIndex];
    if (!lover) return;

    // 卡片阴影和背景
    UI.drawCard(ctx, cardX, cardY, cardW, cardH, {
      shadow: true,
      bgColor: config.THEME.white,
      radius: 24,
    });

    // 角色颜色区域（顶部）
    const colorH = cardH * 0.4;
    ctx.save();
    UI.roundRect(ctx, cardX, cardY, cardW, colorH, 24);
    ctx.clip();
    ctx.fillStyle = lover.bgColor || config.THEME.accent;
    ctx.fillRect(cardX, cardY, cardW, colorH);

    // 角色Emoji头像
    ctx.font = `${cardW / 3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const avatarEmoji = this.gender === 'female' ? '🧑' : '👩';
    ctx.fillText(avatarEmoji, cardX + cardW / 2, cardY + colorH / 2);
    ctx.restore();

    // 角色姓名
    const infoY = cardY + colorH + 16;
    ctx.fillStyle = config.THEME.text;
    ctx.font = `bold ${w / 16}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(lover.name, cardX + cardW / 2, infoY);

    // 性格标签
    const tagY = infoY + 30;
    const tagText = lover.tag;
    ctx.font = `13px "PingFang SC", "Microsoft YaHei", sans-serif`;
    const tagW = ctx.measureText(tagText).width + 20;
    UI.drawTag(ctx, cardX + (cardW - tagW) / 2, tagY, tagText, config.THEME.accent, config.THEME.white, 13);

    // 一句话简介
    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `13px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(lover.intro, cardX + cardW / 2, tagY + 40);

    // 详细介绍
    ctx.fillStyle = config.THEME.text;
    ctx.font = `12px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    const profileY = tagY + 65;
    UI.wrapText(ctx, lover.profile, cardX + 20, profileY, cardW - 40, 18);

    // 页码指示器
    const dotY = h * 0.76;
    const dotR = 4;
    const dotGap = 16;
    const dotsW = this.lovers.length * dotGap;
    const dotsStartX = (w - dotsW) / 2;

    for (let i = 0; i < this.lovers.length; i++) {
      ctx.beginPath();
      ctx.arc(dotsStartX + i * dotGap + dotR, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = i === this.currentIndex ? config.THEME.primary : '#D0D0D0';
      ctx.fill();
    }

    // 确认按钮
    if (this.confirmBtn) {
      UI.drawButton(ctx, this.confirmBtn.x, this.confirmBtn.y, this.confirmBtn.w, this.confirmBtn.h,
        `选择 ${lover.name}`, {
          bgColor: config.THEME.primary,
          fontSize: 16,
        });
    }

    // 左右箭头提示
    if (this.currentIndex > 0) {
      ctx.fillStyle = config.THEME.textLight;
      ctx.font = `24px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('‹', 20, cardY + cardH / 2);
    }
    if (this.currentIndex < this.lovers.length - 1) {
      ctx.fillStyle = config.THEME.textLight;
      ctx.font = `24px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('›', w - 20, cardY + cardH / 2);
    }
  }
}

module.exports = LoverSelectScene;
