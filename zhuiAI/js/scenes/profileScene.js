/**
 * 个人中心场景 - 查看字数余额、关系进度、成就、恋人档案
 */
const config = require('../config');
const UI = require('../ui/ui');
const dataManager = require('../managers/dataManager');

class ProfileScene {
  constructor(canvas, ctx, systemInfo, sceneManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.w = systemInfo.windowWidth;
    this.h = systemInfo.windowHeight;
    this.sceneManager = sceneManager;
    this.backBtn = { x: 10, y: 10, w: 60, h: 36 };
    this.scrollY = 0;
    this.touchStartY = 0;
    this.lastTouchY = 0;
    this.loverImage = null; // 恋人形象图片
  }

  onEnter() {
    this.scrollY = 0;
    const player = dataManager.getPlayerData();
    // 加载恋人形象图片
    if (player && player.current_lover_id) {
      this._loadLoverImage(player.current_lover_id);
    }
    this.render();
  }

  /** 加载恋人形象图片 */
  _loadLoverImage(loverId) {
    const imagePath = config.ASSET_PATHS.LOVER_AVATAR(loverId);
    UI.loadImage(
      imagePath,
      (img) => {
        this.loverImage = img;
        this.render();
      },
      () => {
        this.loverImage = null;
      }
    );
  }

  onTouchStart(e) {
    this.touchStartY = e.touches[0].clientY;
    this.lastTouchY = this.touchStartY;
  }

  onTouchMove(e) {
    const touch = e.touches[0];
    const dy = touch.clientY - this.lastTouchY;
    this.lastTouchY = touch.clientY;
    this.scrollY = Math.max(0, this.scrollY - dy);
    this.render();
  }

  onTouchEnd(e) {
    const touch = e.changedTouches[0];

    // 返回按钮
    if (UI.isInRect(touch, this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h)) {
      this.sceneManager.switchTo('chat');
      return;
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, config.THEME.primary);
    gradient.addColorStop(1, config.THEME.accent);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, 200);
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 200, w, h - 200);

    const player = dataManager.getPlayerData() || {};
    const progress = dataManager.getLoverProgress() || {};
    const lover = config.getLoverById(player.current_lover_id);
    const stage = config.getStageByFavor(progress.favor || 0);

    let y = 20 - this.scrollY;

    // 返回按钮
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    UI.fillRoundRect(ctx, this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h, 18, 'rgba(255,255,255,0.3)');
    ctx.fillStyle = config.THEME.white;
    ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('← 返回', this.backBtn.x + this.backBtn.w / 2, this.backBtn.y + this.backBtn.h / 2);

    // 标题
    ctx.fillStyle = config.THEME.white;
    ctx.font = `bold 20px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('个人中心', w / 2, y + 30);

    y += 65;

    // 恋人头像和名字
    if (lover) {
      // 显示恋人形象图片
      if (this.loverImage) {
        const imgSize = config.UI_LAYOUT.PROFILE_AVATAR_SIZE;
        const imgX = (w - imgSize) / 2;
        const imgY = y + config.UI_LAYOUT.PROFILE_AVATAR_TOP_OFFSET;
        
        // 绘制圆形头像
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // 计算图片缩放
        const imgAspect = this.loverImage.width / this.loverImage.height;
        let drawW, drawH, drawX, drawY;
        
        if (imgAspect > 1) {
          // 图片更宽
          drawH = imgSize;
          drawW = imgSize * imgAspect;
          drawX = imgX - (drawW - imgSize) / 2;
          drawY = imgY;
        } else {
          // 图片更高
          drawW = imgSize;
          drawH = imgSize / imgAspect;
          drawX = imgX;
          drawY = imgY - (drawH - imgSize) / 2;
        }
        
        ctx.drawImage(this.loverImage, drawX, drawY, drawW, drawH);
        ctx.restore();
        
        // 绘制圆形边框
        ctx.strokeStyle = config.THEME.white;
        ctx.lineWidth = config.UI_LAYOUT.PROFILE_AVATAR_BORDER_WIDTH;
        ctx.beginPath();
        ctx.arc(w / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // 恋人名字和标签（在图片下方）
        ctx.fillStyle = config.THEME.white;
        ctx.font = `bold 16px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(lover.name, w / 2, imgY + imgSize + config.UI_LAYOUT.PROFILE_NAME_OFFSET_Y);
        ctx.font = `12px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillText(lover.tag, w / 2, imgY + imgSize + config.UI_LAYOUT.PROFILE_TAG_OFFSET_Y);
        
        y += imgSize + 50;
      } else {
        // 如果图片未加载，使用默认头像
        UI.drawAvatar(ctx, w / 2, y + 30, 30, lover.name, config.THEME.white);
        ctx.fillStyle = config.THEME.white;
        ctx.font = `bold 16px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(lover.name, w / 2, y + 75);
        ctx.font = `12px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillText(lover.tag, w / 2, y + 95);
        
        y += 130;
      }
    } else {
      y += 130;
    }

    // 数据卡片区域
    const cardMargin = 16;
    const cardW = w - cardMargin * 2;

    // 关系进度卡片
    UI.drawCard(ctx, cardMargin, y, cardW, 120, { shadow: true, radius: 16 });

    ctx.fillStyle = config.THEME.text;
    ctx.font = `bold 15px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('💕 关系进度', cardMargin + 16, y + 25);

    // 好感度进度条
    const favor = progress.favor || 0;
    const nextStage = config.STAGES[stage.id + 1];
    const progressRatio = nextStage ? (favor - stage.minFavor) / (nextStage.minFavor - stage.minFavor) : 1;

    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `13px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`当前阶段：${stage.name}`, cardMargin + 16, y + 50);
    ctx.fillText(`好感度：${favor}`, cardMargin + 16, y + 72);

    UI.drawProgressBar(ctx, cardMargin + 16, y + 88, cardW - 32, 8, progressRatio, '#E0E0E0', config.THEME.favor);

    if (nextStage) {
      ctx.fillStyle = config.THEME.textLight;
      ctx.font = `11px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`下一阶段：${nextStage.name}（${nextStage.minFavor}）`, cardMargin + cardW - 16, y + 110);
    }

    y += 140;

    // 字数余额卡片
    UI.drawCard(ctx, cardMargin, y, cardW, 80, { shadow: true, radius: 16 });

    ctx.fillStyle = config.THEME.text;
    ctx.font = `bold 15px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('📝 字数余额', cardMargin + 16, y + 25);

    ctx.fillStyle = config.THEME.primary;
    ctx.font = `bold 24px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`${player.word_balance || 0}`, cardMargin + 16, y + 58);

    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `12px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('字', cardMargin + 80, y + 58);

    // 连续登录
    ctx.textAlign = 'right';
    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `13px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`连续登录 ${player.consecutive_login || 0} 天`, cardMargin + cardW - 16, y + 58);

    y += 100;

    // 游戏数据卡片
    UI.drawCard(ctx, cardMargin, y, cardW, 80, { shadow: true, radius: 16 });

    ctx.fillStyle = config.THEME.text;
    ctx.font = `bold 15px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('📊 游戏数据', cardMargin + 16, y + 25);

    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `13px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`对话轮次：${progress.total_rounds || 0}`, cardMargin + 16, y + 52);
    ctx.textAlign = 'right';
    ctx.fillText(`今日广告：${player.daily_ad_count || 0}/${config.WORD_ECONOMY.DAILY_AD_LIMIT}`, cardMargin + cardW - 16, y + 52);

    y += 100;

    // 成就卡片
    UI.drawCard(ctx, cardMargin, y, cardW, 200, { shadow: true, radius: 16 });

    ctx.fillStyle = config.THEME.text;
    ctx.font = `bold 15px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('🏆 成就', cardMargin + 16, y + 25);

    const events = progress.events_triggered || [];
    const cols = 4;
    const itemW = (cardW - 32) / cols;
    const achieveY = y + 45;

    for (let i = 0; i < config.ACHIEVEMENTS.length; i++) {
      const ach = config.ACHIEVEMENTS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ax = cardMargin + 16 + col * itemW;
      const ay = achieveY + row * 50;

      const unlocked = events.indexOf(ach.id) >= 0;

      // 图标
      ctx.font = `20px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = unlocked ? 1 : 0.3;
      ctx.fillText(ach.icon, ax + itemW / 2, ay + 10);

      // 名称
      ctx.font = `10px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = unlocked ? config.THEME.text : config.THEME.textLight;
      ctx.fillText(ach.name, ax + itemW / 2, ay + 32);
      ctx.globalAlpha = 1;
    }
  }
}

module.exports = ProfileScene;
