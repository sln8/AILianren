/**
 * 事件/剧情场景 - 特殊事件全屏演出
 */
const config = require('../config');
const UI = require('../ui/ui');
const dataManager = require('../managers/dataManager');

class EventScene {
  constructor(canvas, ctx, systemInfo, sceneManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.w = systemInfo.windowWidth;
    this.h = systemInfo.windowHeight;
    this.sceneManager = sceneManager;
    this.eventId = null;
    this.eventInfo = null;
    this.lover = null;
    this.animProgress = 0;
    this.timer = null;
  }

  onEnter(params) {
    this.eventId = (params && params.eventId) || 'first_meet';
    this.eventInfo = config.EVENTS[this.eventId] || { name: '特殊事件', emoji: '✨' };

    const player = dataManager.getPlayerData();
    if (player && player.current_lover_id) {
      this.lover = config.getLoverById(player.current_lover_id);
    }

    this.animProgress = 0;
    this.timer = setInterval(() => {
      this.animProgress += 2;
      if (this.animProgress >= 100) {
        this.animProgress = 100;
        clearInterval(this.timer);
      }
      this.render();
    }, 30);

    this.render();
  }

  onExit() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  onTouchEnd() {
    if (this.animProgress >= 100) {
      this.sceneManager.switchTo('chat');
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // 星光装饰
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const starPositions = [
      [0.1, 0.1], [0.3, 0.15], [0.7, 0.08], [0.85, 0.2],
      [0.15, 0.3], [0.5, 0.25], [0.9, 0.35], [0.2, 0.05],
    ];
    for (const [sx, sy] of starPositions) {
      const size = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.arc(w * sx, h * sy, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 事件Emoji（淡入放大动画）
    const scale = Math.min(1, this.animProgress / 50);
    const alpha = Math.min(1, this.animProgress / 30);
    ctx.globalAlpha = alpha;
    ctx.font = `${60 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.eventInfo.emoji, w / 2, h * 0.3);
    ctx.globalAlpha = 1;

    // 事件名称
    if (this.animProgress > 20) {
      const textAlpha = Math.min(1, (this.animProgress - 20) / 30);
      ctx.globalAlpha = textAlpha;
      ctx.fillStyle = config.THEME.white;
      ctx.font = `bold 28px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(this.eventInfo.name, w / 2, h * 0.45);
      ctx.globalAlpha = 1;
    }

    // 恋人名字
    if (this.animProgress > 40 && this.lover) {
      const nameAlpha = Math.min(1, (this.animProgress - 40) / 30);
      ctx.globalAlpha = nameAlpha;
      ctx.fillStyle = config.THEME.accent;
      ctx.font = `18px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(`—— 与 ${this.lover.name} ——`, w / 2, h * 0.53);
      ctx.globalAlpha = 1;
    }

    // 分割线
    if (this.animProgress > 50) {
      const lineAlpha = Math.min(1, (this.animProgress - 50) / 20);
      ctx.globalAlpha = lineAlpha;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      const lineW = w * 0.4 * (this.animProgress - 50) / 50;
      ctx.beginPath();
      ctx.moveTo(w / 2 - lineW, h * 0.58);
      ctx.lineTo(w / 2 + lineW, h * 0.58);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 进度信息
    if (this.animProgress > 60) {
      const infoAlpha = Math.min(1, (this.animProgress - 60) / 30);
      ctx.globalAlpha = infoAlpha;
      const progress = dataManager.getLoverProgress() || {};
      const stage = config.getStageByFavor(progress.favor || 0);

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(`关系阶段：${stage.name}`, w / 2, h * 0.65);
      ctx.fillText(`好感度：❤️ ${progress.favor || 0}`, w / 2, h * 0.70);
      ctx.globalAlpha = 1;
    }

    // 继续提示
    if (this.animProgress >= 100) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('点击屏幕继续', w / 2, h * 0.85);
    }
  }
}

module.exports = EventScene;
