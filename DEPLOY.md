# 部署指南：阿里云轻量应用服务器

## 为什么选这个？

| 方案 | 月费 | 适合场景 | 本项目适用？ |
|------|------|----------|-------------|
| **轻量应用服务器** | **≈24 元起（新用户 ≈50 元/年）** | 小型 Web 应用 | **✅ 最佳选择** |
| ECS 云服务器 | ≈50-100 元起 | 需要更多控制 | 可以但贵了 |
| 函数计算 FC | 按量付费 | 无状态 API | ❌ SQLite 需要磁盘 |
| 容器服务 ACK | ≈200+ 元 | 微服务集群 | ❌ 杀鸡用牛刀 |
| 云数据库 + ECS | ≈200+ 元 | 大型应用 | ❌ 完全没必要 |

轻量应用服务器 = 固定公网 IP + SSD 磁盘 + 预装系统，开箱即用。

---

## 购买配置

1. 打开 https://www.aliyun.com/product/swas
2. 选择：
   - **地域**：离你最近的（如上海、杭州、北京）
   - **镜像**：应用镜像 → **Node.js** （或系统镜像 Ubuntu 22.04）
   - **套餐**：最低配 **2 核 2G, 50G SSD, 3Mbps**
   - 购买时长：新用户有年付优惠
3. 设置密码，完成购买

---

## 部署步骤（5 分钟）

### 1. SSH 登录服务器

```bash
ssh root@你的服务器IP
```

### 2. 安装 Node.js（如果选了系统镜像）

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
```

> 如果选了 Node.js 应用镜像，跳过这步。

### 3. 上传代码

```bash
cd /opt
git clone https://github.com/xiaomomo/merolite-literacy-game.git game
cd game
npm install --omit=dev
```

### 4. 试运行

```bash
node server.js
# 看到 🌸 美乐蒂识字大冒险 服务器已启动: http://localhost:8080
# Ctrl+C 退出
```

### 5. 用 systemd 设为开机自启

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

systemctl daemon-reload
systemctl enable merolite
systemctl start merolite
```

验证运行状态：

```bash
systemctl status merolite
curl http://localhost:8080
```

### 6. 开放防火墙端口

在阿里云控制台 → 轻量应用服务器 → 防火墙：

- 添加规则：**TCP 8080**

然后用 iPad 访问 `http://你的服务器IP:8080` 就能玩了！

---

## （可选）用 80 端口 + 域名

如果想用 `http://game.example.com` 访问：

```bash
# 改端口为 80
systemctl stop merolite
sed -i 's/PORT=8080/PORT=80/' /etc/systemd/system/merolite.service
systemctl daemon-reload
systemctl start merolite
```

防火墙开放 TCP 80，然后域名 A 记录指向服务器 IP 即可。

---

## 日常维护

```bash
# 查看日志
journalctl -u merolite -f

# 更新代码
cd /opt/game
git pull
npm install --omit=dev
systemctl restart merolite

# 备份数据库
cp /opt/game/game.db /opt/game/game.db.backup.$(date +%Y%m%d)
```

---

## 费用总结

| 项目 | 费用 |
|------|------|
| 轻量应用服务器 2C2G | ≈24 元/月（新用户年付更便宜） |
| 域名（可选） | ≈10-50 元/年 |
| **总计** | **≈24 元/月** |

不需要买云数据库，不需要 OSS，不需要 CDN。一台轻量服务器全搞定。
