/**
 * 《这些年我们追过的AI恋人》— AI互动恋爱养成游戏
 *
 * 入口文件：初始化Canvas、注册场景、启动游戏
 *
 * 上架前需替换：
 * 1. js/config.js 中的 AD_CONFIG（真实广告ID）
 * 2. js/config.js 中的 AI_CONFIG（真实大模型API Key和端点ID）
 */

const sceneManager = require('./js/managers/sceneManager');
const adManager = require('./js/managers/adManager');

// 场景
const LoadingScene = require('./js/scenes/loadingScene');
const GenderScene = require('./js/scenes/genderScene');
const LoverSelectScene = require('./js/scenes/loverSelectScene');
const ChatScene = require('./js/scenes/chatScene');
const ProfileScene = require('./js/scenes/profileScene');
const EventScene = require('./js/scenes/eventScene');
const SettingsScene = require('./js/scenes/settingsScene');

// ===== 初始化 =====
const systemInfo = tt.getSystemInfoSync();
const canvas = tt.createCanvas();
const ctx = canvas.getContext('2d');
canvas.width = systemInfo.windowWidth;
canvas.height = systemInfo.windowHeight;

// 初始化场景管理器
sceneManager.init(canvas, ctx, systemInfo);

// 注册所有场景
sceneManager.register('loading', LoadingScene);
sceneManager.register('gender', GenderScene);
sceneManager.register('loverSelect', LoverSelectScene);
sceneManager.register('chat', ChatScene);
sceneManager.register('profile', ProfileScene);
sceneManager.register('event', EventScene);
sceneManager.register('settings', SettingsScene);

// 初始化广告管理器
adManager.init();

// 初始化抖音云
if (typeof tt.cloud !== 'undefined') {
  tt.cloud.init();
}

// 启动游戏 - 进入加载页
sceneManager.switchTo('loading');

console.log('《这些年我们追过的AI恋人》游戏已启动');
