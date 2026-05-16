# 小贝AI官网 - GitHub Pages 部署教程

## 📋 目录

1. [注册GitHub账号](#1-注册github账号)
2. [创建代码仓库](#2-创建代码仓库)
3. [上传网站文件](#3-上传网站文件)
4. [启用GitHub Pages](#4-启用github-pages)
5. [绑定自定义域名](#5-绑定自定义域名xiaobeime)
6. [后续更新网站](#6-后续更新网站)

---

## 1. 注册GitHub账号

### 第一步：访问GitHub官网

打开浏览器访问：**https://github.com**

### 第二步：填写注册信息

点击 **"Sign up"** 按钮，填写：

| 字段 | 说明 |
|------|------|
| **Email** | 输入您的邮箱（建议用QQ邮箱或Gmail） |
| **Password** | 设置密码（至少8位，建议包含数字和字母） |
| **Username** | 选择用户名（这个会成为您的GitHub地址，如 `yourname`） |

### 第三步：验证邮箱

- GitHub会发送验证邮件到您的邮箱
- 打开邮件，点击验证链接完成验证

### 第四步：选择计划

选择 **Free（免费）** 计划即可，无需付费。

> ✅ **注册完成！** 记住您的用户名（如 `zhangsan`），后面会用到。

---

## 2. 创建代码仓库

### 第一步：创建新仓库

登录GitHub后，点击右上角 **"+"** 号，选择 **"New repository"**

### 第二步：填写仓库信息

| 字段 | 填写内容 |
|------|----------|
| **Repository name** | `xiaobei-me` |
| **Description** | `小贝AI - AI API中转服务官网` |
| **Public/Private** | 选择 **Public**（公开） |
| **Add a README** | ✅ 勾选 |
| **Add .gitignore** | 不需要 |

> ⚠️ **注意**：`Repository name` 会成为您网站的地址的一部分，请认真填写。

### 第三步：创建完成

点击 **"Create repository"** 完成创建。

---

## 3. 上传网站文件

### 方法一：网页上传（最简单）

#### 第一步：进入仓库

在仓库页面，点击 **"Add file"** → **"Upload files"**

#### 第二步：上传文件

将 `index.html` 文件拖拽到上传区域

#### 第三步：提交

- 在 "Commit changes" 区域填写：
  - Message: `Add website homepage`
- 点击 **"Commit changes"**

> ✅ **上传完成！**

---

### 方法二：Git命令上传（进阶）

如果您会使用Git命令：

```bash
# 1. 克隆仓库到本地
git clone https://github.com/您的用户名/xiaobei-me.git

# 2. 进入文件夹
cd xiaobei-me

# 3. 将 index.html 复制到这个文件夹

# 4. 提交上传
git add .
git commit -m "Add website homepage"
git push origin main
```

---

## 4. 启用GitHub Pages

### 第一步：进入仓库设置

在仓库页面，点击 **"Settings"**（设置）标签

### 第二步：找到GitHub Pages

在左侧菜单中找到 **"Pages"** 选项

### 第三步：配置Pages

| 设置项 | 选择内容 |
|--------|----------|
| **Source** | 选择 `Deploy from a branch` |
| **Branch** | 选择 `main` |
| **Folder** | 选择 `/ (root)` |

### 第四步：保存

点击 **"Save"** 保存设置。

### 第五步：等待部署

等待约1-2分钟，刷新页面，您会看到：

```
Your site is live at https://您的用户名.github.io/xiaobei-me/
```

> 🎉 **恭喜！网站已经上线！**

---

## 5. 绑定自定义域名（xiaobei.me）

### 第一步：购买域名

1. 打开 **阿里云**（https://www.aliyun.com）或 **腾讯云**
2. 搜索并购买 `xiaobei.me` 域名
3. 价格约 **¥35-50/年**

### 第二步：在GitHub添加域名

回到GitHub仓库的 **Settings → Pages** 页面：

1. 在 **Custom domain** 输入框中输入：`xiaobei.me`
2. 点击 **Save**
3. 勾选 **Enforce HTTPS**（强制HTTPS）

### 第三步：在阿里云添加DNS解析

1. 登录阿里云控制台
2. 进入 **域名控制台** → 找到 `xiaobei.me`
3. 点击 **解析设置**
4. 添加以下两条解析记录：

| 记录类型 | 主机记录 | 记录值 |
|----------|----------|--------|
| **CNAME** | www | `您的用户名.github.io` |
| **CNAME** | @ | `您的用户名.github.io` |

> ⚠️ **注意**：如果提示 `@` 记录不能添加CNAME，可以改为添加 **ALIAS** 记录，或者咨询域名服务商。

### 第四步：等待生效

DNS解析生效时间约 **10分钟-48小时**。

### 第五步：验证

在浏览器输入 `xiaobei.me`，应该就能看到您的网站了！

> 🎉 **完成！您的网站现在可以通过 xiaobei.me 访问了！**

---

## 6. 后续更新网站

### 更新网站内容

1. 修改本地 `index.html` 文件
2. 重新上传到GitHub仓库
3. GitHub Pages会自动重新部署（约1-2分钟）

### 推荐的编辑器

| 编辑器 | 特点 | 下载 |
|--------|------|------|
| **VS Code** | 微软出品，免费强大 | code.visualstudio.com |
| **Sublime Text** | 轻量快速 | sublimetext.com |
| **记事本** | 系统自带，简单 | 无需下载 |

### 使用VS Code编辑

1. 下载安装 VS Code
2. 用VS Code打开 `index.html` 文件
3. 修改内容后保存
4. 在VS Code中登录GitHub（点击左侧源代码管理图标）
5. 提交并推送更新

---

## 📞 遇到问题？

如果在部署过程中遇到任何问题，可以：

1. 查看GitHub官方文档：https://docs.github.com/pages
2. 联系小贝AI团队获取帮助

---

**祝您部署顺利！🚀**

*小贝AI团队*
*2026年5月15日*
