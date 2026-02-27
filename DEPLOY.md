# 美乐蒂识字大冒险 — 阿里云部署指南

> 本指南面向零运维经验的用户，每一步都有详细说明。跟着做就行。

---

## 目录

1. [购买服务器](#一购买阿里云轻量应用服务器)
2. [登录服务器](#二登录你的服务器)
3. [安装环境](#三安装-nodejs)
4. [部署代码](#四部署游戏代码)
5. [设为开机自启](#五设为开机自启服务器重启也不怕)
6. [开放端口让外网访问](#六开放防火墙端口)
7. [iPad 上添加到主屏幕](#七在-ipad-上玩)
8. [日常维护](#八日常维护)
9. [常见问题](#九常见问题)

---

## 一、购买阿里云轻量应用服务器

### 1.1 打开购买页面

浏览器访问：https://www.aliyun.com/product/swas

> 如果没有阿里云账号，先注册一个（支付宝扫码即可）。

### 1.2 选择配置

| 选项 | 推荐选择 | 说明 |
|------|---------|------|
| 地域 | **上海** 或离你最近的城市 | 越近延迟越低 |
| 镜像类型 | **系统镜像** | 选择干净系统自己装 |
| 操作系统 | **Ubuntu 22.04** | 最常用的 Linux 系统 |
| 套餐 | **2 核 2G / 50G SSD / 3Mbps** | 最低配就够了 |
| 购买时长 | 根据优惠选 | 新用户首年通常有大折扣 |

### 1.3 设置密码

- 设置 **root 密码**（一定要记住！后面登录要用）
- 密码要求：大小写字母 + 数字，8 位以上
- 例如：`MyGame2026!`

### 1.4 完成支付

支付后等 1-2 分钟，服务器就创建好了。

### 1.5 记下服务器公网 IP

进入阿里云控制台 → 轻量应用服务器 → 服务器列表

你会看到一个 **公网 IP 地址**，类似 `47.98.xxx.xxx`，**记下来**。

---

## 二、登录你的服务器

### Mac 用户

打开「终端」应用（在 启动台 → 其他 → 终端），输入：

```bash
ssh root@47.98.xxx.xxx
```

> 把 `47.98.xxx.xxx` 换成你自己的服务器 IP。

第一次连接会问你 `Are you sure you want to continue connecting?`，输入 `yes` 回车。

然后输入你设置的 root 密码（**输入时屏幕不会显示任何字符**，这是正常的，输完直接回车）。

看到类似 `root@iZxxxxxxZ:~#` 就说明登录成功了！

### Windows 用户

下载 [PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html) 或使用 Windows Terminal：

```
ssh root@47.98.xxx.xxx
```

同样输入密码登录。

---

## 三、安装 Node.js

登录成功后，**逐行复制粘贴以下命令**（每输入一行按回车，等执行完再输下一行）：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
```

等它跑完，再输入：

```bash
apt-get install -y nodejs
```

等它跑完，验证安装成功：

```bash
node --version
```

应该显示 `v22.x.x`。如果看到版本号，说明 Node.js 安装成功。

---

## 四、部署游戏代码

### 4.1 下载代码

```bash
cd /opt
git clone https://github.com/xiaomomo/merolite-literacy-game.git game
cd game
git checkout cursor/development-environment-setup-336e
```

> **重要：** 后端代码（`server.js`、`package.json`）在 `cursor/development-environment-setup-336e` 分支上，`git checkout` 这一步不能省略。如果后续代码已合并到 main 分支，则不需要这一步。

### 4.2 安装依赖

```bash
npm install --omit=dev
```

等它跑完，会看到 `added xx packages` 之类的输出。

### 4.3 试运行一下

```bash
node server.js
```

你应该看到：

```
🌸 美乐蒂识字大冒险 服务器已启动: http://localhost:8080
```

看到这行说明一切正常！按 `Ctrl + C` 停掉它（后面会设成自动运行的）。

---

## 五、设为开机自启（服务器重启也不怕）

把以下**整块内容**一次性复制粘贴到终端里，然后按回车：

```bash
cat > /etc/systemd/system/merolite.service << 'EOF'
[Unit]
Description=Merolite Literacy Game
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/game
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=PORT=8080
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

然后依次执行（每行一个回车）：

```bash
systemctl daemon-reload
```

```bash
systemctl enable merolite
```

```bash
systemctl start merolite
```

### 验证是否在运行

```bash
systemctl status merolite
```

看到 **`active (running)`** 就对了（按 `q` 退出查看）。

再用命令确认网页能访问：

```bash
curl -s http://localhost:8080 | head -3
```

看到 `<!DOCTYPE html>` 开头的内容就说明游戏已经在运行了。

---

## 六、开放防火墙端口

游戏在服务器上跑起来了，但外网还访问不了，需要开放端口。

### 6.1 在阿里云控制台操作

1. 打开 https://swas.console.aliyun.com
2. 点击你的服务器
3. 左侧菜单找到 **「防火墙」**
4. 点击 **「添加规则」**
5. 填写：
   - 应用类型：**自定义**
   - 协议：**TCP**
   - 端口范围：**8080**
6. 点击 **确定**

### 6.2 测试访问

打开你的手机或电脑浏览器，输入：

```
http://47.98.xxx.xxx:8080
```

> 把 IP 换成你自己的。

看到粉色的游戏界面就成功了！🎉

---

## 七、在 iPad 上玩

### 7.1 打开游戏

iPad 上打开 Safari，输入 `http://47.98.xxx.xxx:8080`。

### 7.2 添加到主屏幕（像 App 一样）

1. 点击 Safari 底部的 **分享按钮**（方框+箭头图标）
2. 向下滑动，点击 **「添加到主屏幕」**
3. 名称改为 **「识字大冒险」**
4. 点击 **「添加」**

现在主屏幕上就有一个游戏图标了，点击直接全屏打开，就像一个 App！

---

## 八、日常维护

### 查看游戏运行日志

```bash
journalctl -u merolite -f
```

按 `Ctrl + C` 退出。

### 更新游戏代码

当游戏有新版本时：

```bash
cd /opt/game
git pull
npm install --omit=dev
systemctl restart merolite
```

### 备份数据库

建议定期备份小朋友的游戏进度：

```bash
cp /opt/game/game.db /opt/game/backup_$(date +%Y%m%d).db
```

### 重启游戏

如果游戏卡了：

```bash
systemctl restart merolite
```

### 查看小朋友学了多少字

```bash
sqlite3 /opt/game/game.db "SELECT json_extract(state, '$.foundWords') FROM game_state;"
```

---

## 九、常见问题

### Q：网页打不开？

检查清单：
1. 游戏是否在运行？ → `systemctl status merolite` 看是否 `active`
2. 防火墙是否开放了 8080？ → 去阿里云控制台检查
3. IP 地址对不对？ → `curl http://localhost:8080` 在服务器上本地测试

### Q：想用域名访问（不加 :8080）？

1. 买一个域名（阿里云万网，.com 约 55 元/年）
2. 域名实名认证（需要 1-3 天）
3. 添加域名解析：A 记录 → 指向你的服务器 IP
4. 改游戏端口为 80：

```bash
systemctl stop merolite
sed -i 's/PORT=8080/PORT=80/' /etc/systemd/system/merolite.service
systemctl daemon-reload
systemctl start merolite
```

5. 防火墙开放 TCP 80 端口
6. 访问 `http://你的域名` 即可

### Q：服务器重启后数据会丢吗？

**不会。** SQLite 数据库文件保存在服务器硬盘上 `/opt/game/game.db`，服务器重启不影响。只有手动删除这个文件才会丢数据。

### Q：多台设备同时玩会冲突吗？

不会。每个浏览器会自动创建独立的玩家 ID，数据互相隔离。

---

## 费用总结

| 项目 | 费用 |
|------|------|
| 轻量应用服务器 2 核 2G | ≈ 24 元/月（新用户年付更便宜） |
| 域名（可选） | ≈ 10-55 元/年 |
| 云数据库 | 不需要，省了 |
| CDN / OSS | 不需要，省了 |
| **合计** | **≈ 24 元/月，约每天 8 毛钱** |
