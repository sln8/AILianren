/**
 * UI绘制工具 - 提供常用的Canvas UI绘制方法
 */
const config = require('../config');

const UI = {
  /** 绘制圆角矩形 */
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  /** 绘制填充圆角矩形 */
  fillRoundRect(ctx, x, y, w, h, r, color) {
    ctx.fillStyle = color;
    UI.roundRect(ctx, x, y, w, h, r);
    ctx.fill();
  },

  /** 绘制带边框的圆角矩形 */
  strokeRoundRect(ctx, x, y, w, h, r, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 1;
    UI.roundRect(ctx, x, y, w, h, r);
    ctx.stroke();
  },

  /** 绘制按钮 */
  drawButton(ctx, x, y, w, h, text, options) {
    const opts = options || {};
    const bgColor = opts.bgColor || config.THEME.primary;
    const textColor = opts.textColor || config.THEME.white;
    const fontSize = opts.fontSize || 16;
    const radius = opts.radius || h / 2;

    // 按钮背景
    UI.fillRoundRect(ctx, x, y, w, h, radius, bgColor);

    // 按钮文字
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  },

  /** 绘制气泡 */
  drawBubble(ctx, x, y, w, h, text, options) {
    const opts = options || {};
    const bgColor = opts.bgColor || config.THEME.white;
    const textColor = opts.textColor || config.THEME.text;
    const fontSize = opts.fontSize || 14;
    const padding = opts.padding || 10;
    const isLeft = opts.isLeft !== undefined ? opts.isLeft : true;

    // 气泡背景
    UI.fillRoundRect(ctx, x, y, w, h, 12, bgColor);

    // 气泡文字（自动换行）
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    UI.wrapText(ctx, text, x + padding, y + padding, w - padding * 2, fontSize + 4);
  },

  /** 自动换行文字 */
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split('');
    let line = '';
    let currentY = y;

    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const metrics = ctx.measureText(testLine);

      if (chars[i] === '\n') {
        ctx.fillText(line, x, currentY);
        line = '';
        currentY += lineHeight;
      } else if (metrics.width > maxWidth && line.length > 0) {
        ctx.fillText(line, x, currentY);
        line = chars[i];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.length > 0) {
      ctx.fillText(line, x, currentY);
    }
    return currentY + lineHeight;
  },

  /** 计算自动换行文字高度 */
  measureTextHeight(ctx, text, maxWidth, fontSize) {
    const lineHeight = fontSize + 4;
    const chars = text.split('');
    let line = '';
    let lines = 1;

    ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;

    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const metrics = ctx.measureText(testLine);

      if (chars[i] === '\n') {
        line = '';
        lines++;
      } else if (metrics.width > maxWidth && line.length > 0) {
        line = chars[i];
        lines++;
      } else {
        line = testLine;
      }
    }
    return lines * lineHeight;
  },

  /** 绘制进度条 */
  drawProgressBar(ctx, x, y, w, h, progress, bgColor, fillColor) {
    // 背景
    UI.fillRoundRect(ctx, x, y, w, h, h / 2, bgColor || '#E0E0E0');
    // 进度
    const fillW = Math.max(h, w * Math.min(1, Math.max(0, progress)));
    UI.fillRoundRect(ctx, x, y, fillW, h, h / 2, fillColor || config.THEME.primary);
  },

  /** 绘制头像圆形 */
  drawAvatar(ctx, x, y, radius, text, bgColor) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = bgColor || config.THEME.primary;
    ctx.fill();

    // 如果没有图片，用文字首字母代替
    if (text) {
      ctx.fillStyle = config.THEME.white;
      ctx.font = `bold ${radius}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.charAt(0), x, y);
    }
  },

  /** 绘制遮罩层 */
  drawOverlay(ctx, w, h, alpha) {
    ctx.fillStyle = `rgba(0,0,0,${alpha || 0.5})`;
    ctx.fillRect(0, 0, w, h);
  },

  /** 绘制标签 */
  drawTag(ctx, x, y, text, bgColor, textColor, fontSize) {
    const fs = fontSize || 12;
    ctx.font = `${fs}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    const tw = ctx.measureText(text).width;
    const padding = 8;
    const h = fs + 10;

    UI.fillRoundRect(ctx, x, y, tw + padding * 2, h, h / 2, bgColor || config.THEME.accent);
    ctx.fillStyle = textColor || config.THEME.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + (tw + padding * 2) / 2, y + h / 2);

    return tw + padding * 2;
  },

  /** 绘制卡片 */
  drawCard(ctx, x, y, w, h, options) {
    const opts = options || {};
    // 阴影效果
    if (opts.shadow) {
      UI.fillRoundRect(ctx, x + 2, y + 2, w, h, opts.radius || 16, 'rgba(0,0,0,0.1)');
    }
    // 卡片主体
    UI.fillRoundRect(ctx, x, y, w, h, opts.radius || 16, opts.bgColor || config.THEME.white);
    // 边框
    if (opts.border) {
      UI.strokeRoundRect(ctx, x, y, w, h, opts.radius || 16, opts.borderColor || '#E0E0E0', 1);
    }
  },

  /** 绘制顶部状态栏 */
  drawStatusBar(ctx, w, favor, stageName, wordBalance, safeAreaTop) {
    const barH = 60;
    const topOffset = safeAreaTop || 0;
    // 半透明背景
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(0, 0, w, barH + topOffset);
    // 底部分割线
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barH + topOffset);
    ctx.lineTo(w, barH + topOffset);
    ctx.stroke();

    const y = 20 + topOffset;
    const fontSize = 13;
    ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textBaseline = 'middle';

    // 好感度
    ctx.textAlign = 'left';
    ctx.fillStyle = config.THEME.favor;
    ctx.fillText(`❤️ ${favor}`, 12, y);

    // 关系阶段
    ctx.textAlign = 'center';
    ctx.fillStyle = config.THEME.text;
    ctx.fillText(stageName, w / 2, y);

    // 剩余字数
    ctx.textAlign = 'right';
    ctx.fillStyle = wordBalance < config.WORD_ECONOMY.LOW_WARNING ? config.THEME.warning : config.THEME.textLight;
    ctx.fillText(`📝 ${wordBalance}字`, w - 12, y);

    // 阶段目标提示
    ctx.textAlign = 'center';
    ctx.font = `11px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = config.THEME.textLight;
    const stage = config.getStageByFavor(favor);
    const nextStage = config.STAGES[stage.id + 1];
    if (nextStage) {
      ctx.fillText(`目标：好感度达到${nextStage.minFavor}，进入「${nextStage.name}」阶段`, w / 2, y + 22);
    } else {
      ctx.fillText('已达到最终阶段', w / 2, y + 22);
    }
  },

  /** 检测点击是否在矩形区域内 */
  isInRect(touch, x, y, w, h) {
    return touch.clientX >= x && touch.clientX <= x + w &&
           touch.clientY >= y && touch.clientY <= y + h;
  },

  /** 检测点击是否在圆形区域内 */
  isInCircle(touch, cx, cy, r) {
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    return dx * dx + dy * dy <= r * r;
  },

  /** 加载图片（通用工具函数） */
  loadImage(imagePath, onSuccess, onError) {
    if (typeof tt !== 'undefined' && tt.createImage) {
      const img = tt.createImage();
      img.onload = () => {
        if (onSuccess) onSuccess(img);
      };
      img.onerror = () => {
        console.log('图片加载失败:', imagePath);
        if (onError) onError();
      };
      img.src = imagePath;
      return img;
    }
    return null;
  },
};

module.exports = UI;
