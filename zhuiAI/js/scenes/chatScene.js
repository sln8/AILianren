/**
 * 聊天场景 - 核心游玩界面
 */
const config = require('../config');
const UI = require('../ui/ui');
const dataManager = require('../managers/dataManager');
const adManager = require('../managers/adManager');

class ChatScene {
  constructor(canvas, ctx, systemInfo, sceneManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.w = systemInfo.windowWidth;
    this.h = systemInfo.windowHeight;
    this.sceneManager = sceneManager;

    // 聊天相关
    this.messages = [];
    this.scrollY = 0;
    this.maxScrollY = 0;
    this.inputText = '';
    this.isTyping = false;
    this.isSending = false;

    // 恋人信息
    this.lover = null;
    this.progress = null;
    this.loverImage = null; // 恋人形象图片

    // 安全区域 - 防止摄像头阻挡
    this.SAFE_AREA_TOP = 44;  // 顶部安全区域
    this.SAFE_AREA_BOTTOM = 34; // 底部安全区域

    // 布局常量 - 调整为包含安全区域
    this.STATUS_BAR_H = 60;
    this.INPUT_BAR_H = 56;
    this.CHAT_TOP = this.STATUS_BAR_H + this.SAFE_AREA_TOP;
    this.CHAT_BOTTOM = this.h - this.INPUT_BAR_H - this.SAFE_AREA_BOTTOM;
    this.CHAT_H = this.CHAT_BOTTOM - this.CHAT_TOP;
    this.MSG_PADDING = 12;

    // 按钮区域
    this.sendBtn = null;
    this.adBtn = null;
    this.menuBtn = null;
    this.inputArea = null;

    // 弹窗
    this.showAdDialog = false;
    this.showEventDialog = false;
    this.eventData = null;
    this.showMenu = false;

    // 触摸
    this.touchStartY = 0;
    this.lastTouchY = 0;

    // 插屏广告计数
    this.messageCountSinceAd = 0;
  }

  onEnter() {
    const player = dataManager.getPlayerData();
    const progress = dataManager.getLoverProgress();

    if (player && player.current_lover_id) {
      this.lover = config.getLoverById(player.current_lover_id);
      // 加载恋人形象图片
      this._loadLoverImage(player.current_lover_id);
    }
    this.progress = progress || { favor: 0, stage: 0, stage_round_count: 0, total_rounds: 0, events_triggered: [] };
    this.messages = dataManager.getMessages() || [];

    // 如果没有消息，添加欢迎消息
    if (this.messages.length === 0 && this.lover) {
      this.messages.push({
        role: 'system',
        content: `你选择了 ${this.lover.name}（${this.lover.tag}）作为你的恋人。开始你们的故事吧！`,
      });
      this.messages.push({
        role: 'assistant',
        content: this._getWelcomeMessage(),
      });
    }

    this._setupLayout();
    this._calculateScroll();
    this._scrollToBottom();
    this.render();

    // 每日登录
    this._checkDailyLogin();
  }

  _getWelcomeMessage() {
    if (!this.lover) return '你好！';
    const greetings = {
      M1: '你好，我是陆辰逸。图书馆这个角落很安静，你也喜欢看书吗？',
      M2: '嗯？你是谁的助理？...不是来工作的？那你来找我做什么。',
      M3: '嘿！你好呀！我是林屿，校篮球队的。你是新来的同学吧？',
      M4: '（摘下耳机）...抱歉，刚才在听一段旋律。你好，我是苏墨白。',
      M5: '哟，好久不见！还记得我吗？小时候隔壁的江予安呀～',
      M6: '你好。课上见过你——第三排靠窗的位置。我记性一向不错。',
      F1: '你好呀～我是苏晚晴，文学系的。这本书你也想借吗？',
      F2: '请问你找我有什么事？先说好，我时间很紧。',
      F3: '哇！你好你好！我是林小鹿！你看起来人好好的样子～',
      F4: '（轻轻抬头）...你好。抱歉，我刚在画画，没注意到你过来。',
      F5: '嘿！你好！我是姜柠。你也是来运动的吗？一起跑步吧！',
      F6: '...你在看我吗？我是白芷。你的眼神告诉我，你有话想说。',
    };
    return greetings[this.lover.id] || `你好，我是${this.lover.name}。很高兴认识你。`;
  }

  _setupLayout() {
    const w = this.w;
    const h = this.h;
    const barY = h - this.INPUT_BAR_H - this.SAFE_AREA_BOTTOM;

    // 输入区域
    this.inputArea = { x: 12, y: barY + 8, w: w - 130, h: 40 };
    // 发送按钮
    this.sendBtn = { x: w - 112, y: barY + 8, w: 50, h: 40 };
    // 广告按钮
    this.adBtn = { x: w - 56, y: barY + 8, w: 44, h: 40 };
    // 菜单按钮（状态栏右上角，考虑顶部安全区域）
    this.menuBtn = { x: w - 40, y: 10 + this.SAFE_AREA_TOP, w: 30, h: 30 };
  }

  async _checkDailyLogin() {
    try {
      await dataManager.dailyLogin();
    } catch (e) {
      // 忽略
    }
  }

  onTouchStart(e) {
    this.touchStartY = e.touches[0].clientY;
    this.lastTouchY = this.touchStartY;
  }

  onTouchMove(e) {
    if (this.showAdDialog || this.showEventDialog || this.showMenu) return;

    const touch = e.touches[0];
    const dy = touch.clientY - this.lastTouchY;
    this.lastTouchY = touch.clientY;

    // 在聊天区域内滚动
    if (touch.clientY > this.STATUS_BAR_H && touch.clientY < this.CHAT_BOTTOM) {
      this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY - dy));
      this.render();
    }
  }

  onTouchEnd(e) {
    const touch = e.changedTouches[0];

    // 弹窗处理
    if (this.showAdDialog) {
      this._handleAdDialogTouch(touch);
      return;
    }
    if (this.showEventDialog) {
      this._handleEventDialogTouch(touch);
      return;
    }
    if (this.showMenu) {
      this._handleMenuTouch(touch);
      return;
    }

    // 输入区域 - 调起键盘
    if (UI.isInRect(touch, this.inputArea.x, this.inputArea.y, this.inputArea.w, this.inputArea.h)) {
      this._showKeyboard();
      return;
    }

    // 发送按钮
    if (UI.isInRect(touch, this.sendBtn.x, this.sendBtn.y, this.sendBtn.w, this.sendBtn.h)) {
      this._sendMessage();
      return;
    }

    // 广告按钮
    if (UI.isInRect(touch, this.adBtn.x, this.adBtn.y, this.adBtn.w, this.adBtn.h)) {
      this._showAdDialog();
      return;
    }

    // 菜单按钮
    if (UI.isInRect(touch, this.menuBtn.x, this.menuBtn.y, this.menuBtn.w, this.menuBtn.h)) {
      this.showMenu = true;
      this.render();
      return;
    }
  }

  /** 调起键盘 */
  _showKeyboard() {
    if (typeof tt.showKeyboard === 'function') {
      tt.showKeyboard({
        defaultValue: this.inputText,
        maxLength: 500,
        confirmType: 'send',
        success: () => {},
      });

      tt.onKeyboardInput((res) => {
        this.inputText = res.value || '';
        this.render();
      });

      tt.onKeyboardConfirm((res) => {
        this.inputText = res.value || '';
        this._sendMessage();
      });

      tt.onKeyboardComplete(() => {
        tt.offKeyboardInput();
        tt.offKeyboardConfirm();
        tt.offKeyboardComplete();
      });
    }
  }

  /** 发送消息 */
  async _sendMessage() {
    const text = this.inputText.trim();
    if (!text || this.isSending) return;

    const player = dataManager.getPlayerData();

    // 检查字数
    if (player && player.word_balance <= 0) {
      this._showAdDialog();
      return;
    }

    this.inputText = '';
    this.isSending = true;

    // 先添加用户消息
    this.messages.push({ role: 'user', content: text });
    this._calculateScroll();
    this._scrollToBottom();
    this.render();

    try {
      const result = await dataManager.sendMessage(text);

      if (result) {
        // 更新消息列表（dataManager已经添加了消息）
        this.messages = dataManager.getMessages();
        this.progress = dataManager.getLoverProgress();

        // 检查事件触发
        if (result.event) {
          this.eventData = result.event;
          this.showEventDialog = true;
        }

        // 字数预警
        if (player && dataManager.getPlayerData().word_balance < config.WORD_ECONOMY.LOW_WARNING) {
          setTimeout(() => {
            if (!this.showEventDialog) {
              this._showAdDialog();
            }
          }, 1500);
        }

        // 插屏广告计数
        this.messageCountSinceAd++;
        if (this.messageCountSinceAd >= config.WORD_ECONOMY.INTERSTITIAL_AD_INTERVAL) {
          this.messageCountSinceAd = 0;
          setTimeout(() => {
            adManager.showInterstitial();
          }, 1000);
        }
      }
    } catch (err) {
      console.error('发送消息失败:', err);
      this.messages.push({
        role: 'system',
        content: '消息发送失败，请重试',
      });
    }

    this.isSending = false;
    this._calculateScroll();
    this._scrollToBottom();
    this.render();
  }

  /** 显示广告弹窗 */
  _showAdDialog() {
    this.showAdDialog = true;
    this.render();
  }

  /** 处理广告弹窗触摸 */
  _handleAdDialogTouch(touch) {
    const w = this.w;
    const h = this.h;
    const dlgW = w * 0.8;
    const dlgH = 220;
    const dlgX = (w - dlgW) / 2;
    const dlgY = (h - dlgH) / 2;

    // 看广告按钮
    const watchBtnY = dlgY + dlgH - 100;
    if (UI.isInRect(touch, dlgX + 20, watchBtnY, dlgW - 40, 44)) {
      this._watchAd();
      return;
    }

    // 关闭按钮
    const closeBtnY = dlgY + dlgH - 48;
    if (UI.isInRect(touch, dlgX + 20, closeBtnY, dlgW - 40, 36)) {
      this.showAdDialog = false;
      this.render();
      return;
    }
  }

  /** 加载恋人形象图片 */
  _loadLoverImage(loverId) {
    const imagePath = `images/${loverId}_avatar.png`;
    if (typeof tt !== 'undefined' && tt.createImage) {
      const img = tt.createImage();
      img.onload = () => {
        this.loverImage = img;
        this.render();
      };
      img.onerror = () => {
        console.log('恋人形象图片加载失败:', imagePath);
        this.loverImage = null;
      };
      img.src = imagePath;
    }
  }

  /** 观看广告 */
  async _watchAd() {
    try {
      const completed = await adManager.showRewardedVideo();
      if (completed) {
        await dataManager.watchAdReward();
        dataManager.saveToStorage();
        this.showAdDialog = false;
        this.render();
      }
    } catch (err) {
      console.error('广告播放失败:', err);
      // 开发环境模拟
      try {
        await dataManager.watchAdReward();
      } catch (e) {
        // 离线模式直接加字数
        if (dataManager.getPlayerData()) {
          dataManager.getPlayerData().word_balance += config.WORD_ECONOMY.AD_REWARD;
          dataManager.saveToStorage();
        }
      }
      this.showAdDialog = false;
      this.render();
    }
  }

  /** 处理事件弹窗触摸 */
  _handleEventDialogTouch(touch) {
    // 点击任意位置关闭
    this.showEventDialog = false;
    this.eventData = null;
    this.render();
  }

  /** 处理菜单触摸 */
  _handleMenuTouch(touch) {
    const w = this.w;
    const menuW = 140;
    const menuX = w - menuW - 10;
    const menuY = this.STATUS_BAR_H;
    const itemH = 44;

    const menuItems = ['个人中心', '更换恋人', '设置', '关闭菜单'];
    for (let i = 0; i < menuItems.length; i++) {
      if (UI.isInRect(touch, menuX, menuY + i * itemH, menuW, itemH)) {
        this.showMenu = false;
        if (i === 0) {
          this.sceneManager.switchTo('profile');
        } else if (i === 1) {
          this.sceneManager.switchTo('loverSelect', {
            gender: dataManager.getPlayerData().gender,
            isSwitch: true,
          });
        } else if (i === 2) {
          this.sceneManager.switchTo('settings');
        }
        this.render();
        return;
      }
    }

    // 点击其他区域关闭菜单
    this.showMenu = false;
    this.render();
  }

  /** 计算滚动范围 */
  _calculateScroll() {
    const ctx = this.ctx;
    let totalH = this.MSG_PADDING;

    for (const msg of this.messages) {
      totalH += this._getMessageHeight(ctx, msg) + 12;
    }

    this.maxScrollY = Math.max(0, totalH - this.CHAT_H);
  }

  /** 滚动到底部 */
  _scrollToBottom() {
    this.scrollY = this.maxScrollY;
  }

  /** 获取单条消息高度 */
  _getMessageHeight(ctx, msg) {
    const maxBubbleW = this.w * 0.65;
    const fontSize = 14;
    const padding = 10;

    ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    const textH = UI.measureTextHeight(ctx, msg.content, maxBubbleW - padding * 2, fontSize);

    if (msg.role === 'system') {
      return textH + 10;
    }
    return textH + padding * 2 + 8; // 加上头像空间
  }

  render() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    // 背景
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, w, h);

    // 恋人形象作为全屏背景
    if (this.loverImage) {
      // 绘制全屏背景图片
      ctx.save();
      ctx.globalAlpha = 0.3; // 设置透明度，避免影响聊天内容可读性
      
      // 计算图片缩放以填充屏幕
      const imgAspect = this.loverImage.width / this.loverImage.height;
      const screenAspect = w / h;
      let drawW, drawH, drawX, drawY;
      
      if (imgAspect > screenAspect) {
        // 图片更宽，以高度为准
        drawH = h;
        drawW = h * imgAspect;
        drawX = (w - drawW) / 2;
        drawY = 0;
      } else {
        // 图片更高，以宽度为准
        drawW = w;
        drawH = w / imgAspect;
        drawX = 0;
        drawY = (h - drawH) / 2;
      }
      
      ctx.drawImage(this.loverImage, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else if (this.lover) {
      // 如果图片未加载，使用渐变背景色
      const bgGradient = ctx.createLinearGradient(0, 0, 0, h * 0.3);
      bgGradient.addColorStop(0, this.lover.bgColor || '#FFF5F7');
      bgGradient.addColorStop(1, '#F5F5F5');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, w, h * 0.3);
    }

    // 绘制聊天消息
    this._renderMessages();

    // 状态栏
    this._renderStatusBar();

    // 输入栏
    this._renderInputBar();

    // 弹窗
    if (this.showAdDialog) this._renderAdDialog();
    if (this.showEventDialog) this._renderEventDialog();
    if (this.showMenu) this._renderMenu();
  }

  /** 渲染聊天消息 */
  _renderMessages() {
    const ctx = this.ctx;
    const w = this.w;

    // 裁剪区域
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, this.STATUS_BAR_H, w, this.CHAT_H);
    ctx.clip();

    let y = this.STATUS_BAR_H + this.MSG_PADDING - this.scrollY;
    const maxBubbleW = w * 0.65;
    const fontSize = 14;
    const padding = 10;
    const avatarR = 16;

    for (const msg of this.messages) {
      if (msg.role === 'system') {
        // 系统消息
        ctx.fillStyle = config.THEME.textLight;
        ctx.font = `12px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const textH = UI.measureTextHeight(ctx, msg.content, w - 60, 12);
        UI.fillRoundRect(ctx, w * 0.1, y, w * 0.8, textH + 10, 12, 'rgba(0,0,0,0.05)');
        ctx.fillStyle = config.THEME.textLight;
        ctx.font = `12px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'left';
        UI.wrapText(ctx, msg.content, w * 0.1 + 10, y + 5, w * 0.8 - 20, 16);
        y += textH + 22;
      } else if (msg.role === 'user') {
        // 玩家消息（右侧蓝色气泡）
        ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        const textH = UI.measureTextHeight(ctx, msg.content, maxBubbleW - padding * 2, fontSize);
        const bubbleH = textH + padding * 2;
        const bubbleW = Math.min(maxBubbleW, ctx.measureText(msg.content).width + padding * 2 + 10);
        const bubbleX = w - bubbleW - 12 - avatarR * 2 - 8;

        // 头像
        UI.drawAvatar(ctx, w - 12 - avatarR, y + avatarR, avatarR, '我', config.THEME.playerBubble);

        // 气泡
        UI.fillRoundRect(ctx, bubbleX, y, bubbleW, bubbleH, 12, config.THEME.playerBubble);
        ctx.fillStyle = config.THEME.white;
        ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        UI.wrapText(ctx, msg.content, bubbleX + padding, y + padding, bubbleW - padding * 2, fontSize + 4);

        y += bubbleH + 12;
      } else if (msg.role === 'assistant') {
        // AI恋人消息（左侧粉色气泡）
        ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        const textH = UI.measureTextHeight(ctx, msg.content, maxBubbleW - padding * 2, fontSize);
        const bubbleH = textH + padding * 2;
        const bubbleX = 12 + avatarR * 2 + 8;

        // 头像
        const avatarText = this.lover ? this.lover.name : 'AI';
        UI.drawAvatar(ctx, 12 + avatarR, y + avatarR, avatarR, avatarText, config.THEME.loverBubble);

        // 气泡
        UI.fillRoundRect(ctx, bubbleX, y, maxBubbleW, bubbleH, 12, config.THEME.loverBubble);
        ctx.fillStyle = config.THEME.white;
        ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        UI.wrapText(ctx, msg.content, bubbleX + padding, y + padding, maxBubbleW - padding * 2, fontSize + 4);

        // 好感度变化显示
        if (msg.favorDelta) {
          const deltaText = msg.favorDelta > 0 ? `+${msg.favorDelta}` : `${msg.favorDelta}`;
          const deltaColor = msg.favorDelta > 0 ? config.THEME.success : config.THEME.favor;
          ctx.fillStyle = deltaColor;
          ctx.font = `11px "PingFang SC", "Microsoft YaHei", sans-serif`;
          ctx.textAlign = 'right';
          ctx.fillText(`❤️ ${deltaText}`, bubbleX + maxBubbleW, y + bubbleH + 2);
        }

        y += bubbleH + (msg.favorDelta ? 20 : 12);
      }
    }

    // 正在输入指示
    if (this.isSending) {
      const bubbleX = 12 + avatarR * 2 + 8;
      UI.fillRoundRect(ctx, bubbleX, y, 80, 36, 12, config.THEME.loverBubble);
      ctx.fillStyle = config.THEME.white;
      ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('输入中...', bubbleX + 12, y + 14);
    }

    ctx.restore();
  }

  /** 渲染状态栏 */
  _renderStatusBar() {
    const ctx = this.ctx;
    const w = this.w;
    const player = dataManager.getPlayerData();
    const progress = this.progress || {};
    const favor = progress.favor || 0;
    const stage = config.getStageByFavor(favor);
    const wordBalance = (player && player.word_balance) || 0;

    // 添加顶部安全区域背景
    ctx.fillStyle = config.THEME.white;
    ctx.fillRect(0, 0, w, this.STATUS_BAR_H + this.SAFE_AREA_TOP);

    UI.drawStatusBar(ctx, w, favor, stage.name, wordBalance, this.SAFE_AREA_TOP);

    // 菜单按钮
    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `20px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☰', this.menuBtn.x + this.menuBtn.w / 2, this.menuBtn.y + this.menuBtn.h / 2);
  }

  /** 渲染输入栏 */
  _renderInputBar() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const barY = h - this.INPUT_BAR_H - this.SAFE_AREA_BOTTOM;

    // 背景
    ctx.fillStyle = config.THEME.white;
    ctx.fillRect(0, barY, w, this.INPUT_BAR_H + this.SAFE_AREA_BOTTOM);
    // 上边线
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, barY);
    ctx.lineTo(w, barY);
    ctx.stroke();

    // 输入框
    UI.fillRoundRect(ctx, this.inputArea.x, this.inputArea.y, this.inputArea.w, this.inputArea.h, 20, '#F5F5F5');
    ctx.fillStyle = this.inputText ? config.THEME.text : '#B0B0B0';
    ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const displayText = this.inputText || '说点什么...';
    ctx.fillText(displayText, this.inputArea.x + 16, this.inputArea.y + this.inputArea.h / 2);

    // 发送按钮
    UI.drawButton(ctx, this.sendBtn.x, this.sendBtn.y, this.sendBtn.w, this.sendBtn.h, '发送', {
      bgColor: this.inputText ? config.THEME.primary : '#D0D0D0',
      fontSize: 13,
      radius: 20,
    });

    // 广告按钮
    UI.fillRoundRect(ctx, this.adBtn.x, this.adBtn.y, this.adBtn.w, this.adBtn.h, 20, config.THEME.warning);
    ctx.fillStyle = config.THEME.white;
    ctx.font = `12px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+字', this.adBtn.x + this.adBtn.w / 2, this.adBtn.y + this.adBtn.h / 2);
  }

  /** 渲染广告弹窗 */
  _renderAdDialog() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    // 遮罩
    UI.drawOverlay(ctx, w, h, 0.5);

    const dlgW = w * 0.8;
    const dlgH = 220;
    const dlgX = (w - dlgW) / 2;
    const dlgY = (h - dlgH) / 2;

    // 弹窗背景
    UI.drawCard(ctx, dlgX, dlgY, dlgW, dlgH, { shadow: true, radius: 20, bgColor: config.THEME.white });

    // 标题
    ctx.fillStyle = config.THEME.text;
    ctx.font = `bold 18px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📝 获取更多字数', dlgX + dlgW / 2, dlgY + 35);

    // 说明
    const player = dataManager.getPlayerData();
    const balance = (player && player.word_balance) || 0;
    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`当前剩余：${balance} 字`, dlgX + dlgW / 2, dlgY + 65);
    ctx.fillText(`观看广告可获得 ${config.WORD_ECONOMY.AD_REWARD} 字`, dlgX + dlgW / 2, dlgY + 90);

    // 看广告按钮
    UI.drawButton(ctx, dlgX + 20, dlgY + dlgH - 100, dlgW - 40, 44, '🎬 看广告获取字数', {
      bgColor: config.THEME.primary,
      fontSize: 15,
    });

    // 关闭按钮
    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('稍后再说', dlgX + dlgW / 2, dlgY + dlgH - 28);
  }

  /** 渲染事件弹窗 */
  _renderEventDialog() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    UI.drawOverlay(ctx, w, h, 0.6);

    const dlgW = w * 0.85;
    const dlgH = 280;
    const dlgX = (w - dlgW) / 2;
    const dlgY = (h - dlgH) / 2;

    // 弹窗背景
    UI.drawCard(ctx, dlgX, dlgY, dlgW, dlgH, { shadow: true, radius: 24, bgColor: config.THEME.white });

    const eventInfo = this.eventData ? (config.EVENTS[this.eventData] || { name: this.eventData, emoji: '✨' }) : { name: '特殊事件', emoji: '✨' };

    // Emoji
    ctx.font = `48px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(eventInfo.emoji, dlgX + dlgW / 2, dlgY + 70);

    // 事件名
    ctx.fillStyle = config.THEME.text;
    ctx.font = `bold 22px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(eventInfo.name, dlgX + dlgW / 2, dlgY + 130);

    // 恋人名
    if (this.lover) {
      ctx.fillStyle = config.THEME.primary;
      ctx.font = `16px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(`与 ${this.lover.name} 的故事`, dlgX + dlgW / 2, dlgY + 165);
    }

    // 当前进度
    const progress = this.progress || {};
    const stage = config.getStageByFavor(progress.favor || 0);
    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`当前关系：${stage.name}  好感度：${progress.favor || 0}`, dlgX + dlgW / 2, dlgY + 200);

    // 提示
    ctx.fillStyle = config.THEME.textLight;
    ctx.font = `12px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('点击任意位置继续', dlgX + dlgW / 2, dlgY + dlgH - 25);
  }

  /** 渲染菜单 */
  _renderMenu() {
    const ctx = this.ctx;
    const w = this.w;

    // 半透明遮罩
    UI.drawOverlay(ctx, w, this.h, 0.3);

    const menuW = 140;
    const menuX = w - menuW - 10;
    const menuY = this.STATUS_BAR_H;
    const itemH = 44;
    const items = ['👤 个人中心', '💕 更换恋人', '⚙️ 设置', '✕ 关闭菜单'];

    // 菜单背景
    UI.drawCard(ctx, menuX, menuY, menuW, items.length * itemH, {
      shadow: true,
      radius: 12,
      bgColor: config.THEME.white,
    });

    for (let i = 0; i < items.length; i++) {
      ctx.fillStyle = config.THEME.text;
      ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(items[i], menuX + 16, menuY + i * itemH + itemH / 2);

      // 分割线
      if (i < items.length - 1) {
        ctx.strokeStyle = '#F0F0F0';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(menuX + 10, menuY + (i + 1) * itemH);
        ctx.lineTo(menuX + menuW - 10, menuY + (i + 1) * itemH);
        ctx.stroke();
      }
    }
  }
}

module.exports = ChatScene;
