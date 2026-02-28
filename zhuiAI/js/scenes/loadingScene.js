/**
 * 加载页场景
 */
const config = require('../config');
const UI = require('../ui/ui');

class LoadingScene {
  constructor(canvas, ctx, systemInfo, sceneManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.w = systemInfo.windowWidth;
    this.h = systemInfo.windowHeight;
    this.sceneManager = sceneManager;
    this.progress = 0;
    this.loadingText = '正在加载...';
    this.timer = null;
  }

  onEnter() {
    // 模拟加载进度
    this.progress = 0;
    this.timer = setInterval(() => {
      this.progress += Math.random() * 15 + 5;
      if (this.progress >= 100) {
        this.progress = 100;
        clearInterval(this.timer);
        this.loadingText = '加载完成！';
        this.render();
        // 延迟进入下一个场景
        setTimeout(() => {
          this._checkAndNavigate();
        }, 500);
      }
      this.render();
    }, 200);
  }

  onExit() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /** 检查玩家状态并导航 */
  _checkAndNavigate() {
    const dataManager = require('../managers/dataManager');

    // 尝试从本地存储恢复
    const hasLocal = dataManager.loadFromStorage();
    if (hasLocal && dataManager.getPlayerData()) {
      const player = dataManager.getPlayerData();
      if (player.gender && player.current_lover_id) {
        // 已有进度，加载聊天历史后进入对话界面
        dataManager.getProgress().then(() => {
          return dataManager.getChatHistory(1, 50);
        }).then((history) => {
          if (history && history.messages) {
            dataManager.setMessages(history.messages);
          }
          this.sceneManager.switchTo('chat');
        }).catch(() => {
          // 云端获取失败，用本地数据
          this.sceneManager.switchTo('chat');
        });
        return;
      } else if (player.gender) {
        // 已选性别但未选恋人
        this.sceneManager.switchTo('loverSelect', { gender: player.gender });
        return;
      }
    }

    // 新用户，进入性别选择
    this.sceneManager.switchTo('gender');
  }

  render() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#FF6B9D');
    gradient.addColorStop(0.5, '#F8A5C2');
    gradient.addColorStop(1, '#FFF5F7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // 游戏标题
    ctx.fillStyle = config.THEME.white;
    ctx.font = `bold ${w / 14}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('这些年', w / 2, h * 0.3);
    ctx.fillText('我们追过的AI恋人', w / 2, h * 0.3 + w / 12);

    // 装饰心形
    ctx.font = `${w / 8}px Arial`;
    ctx.fillText('💕', w / 2, h * 0.18);

    // 进度条
    const barW = w * 0.6;
    const barH = 8;
    const barX = (w - barW) / 2;
    const barY = h * 0.55;

    UI.drawProgressBar(ctx, barX, barY, barW, barH, this.progress / 100, 'rgba(255,255,255,0.3)', config.THEME.white);

    // 进度文字
    ctx.fillStyle = config.THEME.white;
    ctx.font = `14px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`${this.loadingText} ${Math.floor(this.progress)}%`, w / 2, barY + 30);

    // 底部版权
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `11px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('AI互动恋爱养成游戏', w / 2, h - 40);
  }
}

module.exports = LoadingScene;
