/**
 * 游戏云函数入口 - 路由分发
 *
 * 统一入口，根据 action 参数分发到各个处理函数
 */
const { dySDK } = require('@open-dy/node-server-sdk');
const initPlayer = require('./initPlayer');
const selectLover = require('./selectLover');
const sendMessage = require('./sendMessage');
const dailyLogin = require('./dailyLogin');
const watchAd = require('./watchAd');
const getProgress = require('./getProgress');
const getChatHistory = require('./getChatHistory');
const switchLover = require('./switchLover');

const handlers = {
  initPlayer,
  selectLover,
  sendMessage,
  dailyLogin,
  watchAd,
  getProgress,
  getChatHistory,
  switchLover,
};

module.exports = async function (params, context) {
  const serviceContext = dySDK.context(context);
  const reqContext = serviceContext.getContext();
  const openId = reqContext?.openId;

  if (!openId) {
    return { code: 1, message: '无法获取用户身份', data: null };
  }

  const action = params?.action;
  if (!action || !handlers[action]) {
    return { code: 1, message: `未知操作: ${action}`, data: null };
  }

  try {
    const database = dySDK.database();
    const result = await handlers[action](params, { openId, database, context });
    return { code: 0, message: '', data: result };
  } catch (err) {
    context.log('云函数错误:', action, err.message || err);
    return { code: 1, message: err.message || '服务器错误', data: null };
  }
};
