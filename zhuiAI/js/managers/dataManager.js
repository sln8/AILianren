/**
 * 数据管理器 - 负责与云函数通信和本地数据缓存
 */
const config = require('./config');

class DataManager {
  constructor() {
    this.playerData = null;
    this.loverProgress = null;
    this.chatMessages = [];
    this.openId = null;
  }

  /** 调用云函数通用方法 */
  callCloud(funcName, data) {
    return new Promise((resolve, reject) => {
      tt.cloud.callFunction({
        name: 'game',
        data: {
          action: funcName,
          ...data,
        },
        success: (res) => {
          if (res.result && res.result.code === 0) {
            resolve(res.result.data);
          } else {
            reject(new Error((res.result && res.result.message) || '云函数调用失败'));
          }
        },
        fail: (err) => {
          reject(err);
        },
      });
    });
  }

  /** 初始化玩家 */
  async initPlayer(gender) {
    const data = await this.callCloud('initPlayer', { gender });
    this.playerData = data;
    return data;
  }

  /** 每日登录 */
  async dailyLogin() {
    const data = await this.callCloud('dailyLogin', {});
    if (data) {
      this.playerData = { ...this.playerData, ...data };
    }
    return data;
  }

  /** 选择恋人 */
  async selectLover(loverId) {
    const data = await this.callCloud('selectLover', { loverId });
    this.loverProgress = data.progress;
    this.playerData = { ...this.playerData, ...data.player };
    this.chatMessages = [];
    return data;
  }

  /** 发送消息 */
  async sendMessage(content) {
    const data = await this.callCloud('sendMessage', { content });
    // 更新本地数据
    if (data) {
      this.chatMessages.push({ role: 'user', content: content });
      this.chatMessages.push({
        role: 'assistant',
        content: data.reply,
        favorDelta: data.favorDelta,
        event: data.event,
      });
      if (data.progress) {
        this.loverProgress = data.progress;
      }
      if (data.wordBalance !== undefined) {
        this.playerData.word_balance = data.wordBalance;
      }
    }
    return data;
  }

  /** 获取进度 */
  async getProgress() {
    const data = await this.callCloud('getProgress', {});
    this.playerData = data.player;
    this.loverProgress = data.progress;
    return data;
  }

  /** 获取聊天历史 */
  async getChatHistory(page, pageSize) {
    const data = await this.callCloud('getChatHistory', { page, pageSize });
    return data;
  }

  /** 观看广告奖励 */
  async watchAdReward() {
    const data = await this.callCloud('watchAd', {});
    if (data) {
      this.playerData.word_balance = data.wordBalance;
      this.playerData.daily_ad_count = data.dailyAdCount;
    }
    return data;
  }

  /** 更换恋人 */
  async switchLover(newLoverId) {
    const data = await this.callCloud('switchLover', { newLoverId });
    if (data) {
      this.loverProgress = data.progress;
      this.playerData = { ...this.playerData, ...data.player };
      this.chatMessages = [];
    }
    return data;
  }

  /** 获取本地缓存的玩家数据 */
  getPlayerData() {
    return this.playerData;
  }

  /** 获取本地缓存的恋爱进度 */
  getLoverProgress() {
    return this.loverProgress;
  }

  /** 获取本地消息列表 */
  getMessages() {
    return this.chatMessages;
  }

  /** 设置消息列表（从历史加载） */
  setMessages(msgs) {
    this.chatMessages = msgs || [];
  }

  /** 从本地存储恢复数据 */
  loadFromStorage() {
    try {
      const data = tt.getStorageSync('gameData');
      if (data) {
        this.playerData = data.playerData || null;
        this.loverProgress = data.loverProgress || null;
        this.openId = data.openId || null;
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }

  /** 保存数据到本地存储 */
  saveToStorage() {
    try {
      tt.setStorageSync('gameData', {
        playerData: this.playerData,
        loverProgress: this.loverProgress,
        openId: this.openId,
      });
    } catch (e) {
      // ignore
    }
  }
}

module.exports = new DataManager();
