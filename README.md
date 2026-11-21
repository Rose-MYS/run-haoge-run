# 郝哥快跑 · Run Haoge Run

《郝哥快跑》是一款可离线游玩的 3D 三车道无尽跑酷小游戏。躲开障碍、收集西瓜，用保熟技能拉开追逃距离，解锁彩蛋。

## 开始游玩

双击 `index.html` 或 Windows 下的 `打开游戏.bat`。此仓库的版本使用程序化角色和合成音效，Three.js 随源码提供。

| 操作 | 键盘 | 触屏 |
| --- | --- | --- |
| 换道 | ← → 或 A / D | 左右滑 |
| 跳跃和二段跳 | ↑ 或 W | 上滑 |
| 滑铲和快速落地 | ↓ 或 S | 下滑 |
| 暂停 / 继续 | 空格、Esc 或 P | 暂停按钮 |
| 释放保熟技能 | E | 「保熟！」按钮 |
| 静音 | M | 扬声器按钮 |

## 开发

- 运行 `node tools/serve-dev.js`，打开 `http://127.0.0.1:8787/`。加 `?seed=42` 可复现生成布局。
- 运行 `node tools/build-single-file.js` 可生成 `dist/郝哥快跑.html`。也可以将新路径作为第一个参数。
- 运行 `python tools/test-gameplay.py` 可执行玩法回归测试。需要本机 Chrome 和 Python Playwright。

玩法数值位于 `js/config.js`，程序化角色位于 `js/characters.js`，主循环和玩法逻辑位于 `js/game.js`。

本仓库提供可玩的源码快照。本地项目中的脸部贴图、GLB 模型、录音、参考素材和安装包由作者在本机管理。Three.js 的第三方许可见 [MIT 许可](js/vendor/THREE-LICENSE.txt)。
