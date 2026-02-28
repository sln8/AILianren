/**
 * 场景管理器 - 管理游戏场景切换
 */
class SceneManager {
  constructor() {
    this.scenes = {};
    this.currentScene = null;
    this.currentSceneName = '';
    this.canvas = null;
    this.ctx = null;
    this.systemInfo = null;
  }

  /** 初始化 */
  init(canvas, ctx, systemInfo) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.systemInfo = systemInfo;

    // 注册触摸事件
    tt.onTouchStart(this._onTouchStart.bind(this));
    tt.onTouchMove(this._onTouchMove.bind(this));
    tt.onTouchEnd(this._onTouchEnd.bind(this));
  }

  /** 注册场景 */
  register(name, sceneClass) {
    this.scenes[name] = sceneClass;
  }

  /** 切换场景 */
  switchTo(name, params) {
    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit();
    }

    const SceneClass = this.scenes[name];
    if (!SceneClass) {
      console.error('场景不存在:', name);
      return;
    }

    this.currentScene = new SceneClass(this.canvas, this.ctx, this.systemInfo, this);
    this.currentSceneName = name;

    if (this.currentScene.onEnter) {
      this.currentScene.onEnter(params);
    }

    this.render();
  }

  /** 渲染当前场景 */
  render() {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render();
    }
  }

  /** 触摸开始 */
  _onTouchStart(e) {
    if (this.currentScene && this.currentScene.onTouchStart) {
      this.currentScene.onTouchStart(e);
    }
  }

  /** 触摸移动 */
  _onTouchMove(e) {
    if (this.currentScene && this.currentScene.onTouchMove) {
      this.currentScene.onTouchMove(e);
    }
  }

  /** 触摸结束 */
  _onTouchEnd(e) {
    if (this.currentScene && this.currentScene.onTouchEnd) {
      this.currentScene.onTouchEnd(e);
    }
  }
}

module.exports = new SceneManager();
