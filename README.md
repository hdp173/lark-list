# 任务管理系统

基于 NestJS + React + PostgreSQL 的全栈任务管理应用

## 功能特性

- 用户注册与登录
- 任务的创建、编辑、删除
- 任务状态管理（待办、进行中、已完成）
- 任务分配与协作
- 子任务支持
- 团队管理
- 任务评论与历史记录
- 通知提醒

## 快速开始

### 使用 Docker（推荐）

```bash
docker-compose up -d --build
```

启动后访问：
- 前端：http://localhost
- 后端API：http://localhost:3000

### 本地开发

**后端：**
```bash
cd backend
npm install
npm run start:dev
```

**前端：**
```bash
cd frontend
npm install
npm run dev
```

## 技术栈

**后端**
- NestJS
- TypeORM
- PostgreSQL
- JWT认证

**前端**
- React 18
- Ant Design
- Vite
- React Router

## 项目结构

```
├── backend/          # NestJS后端
│   ├── src/
│   │   ├── modules/  # 功能模块
│   │   └── main.ts
│   └── Dockerfile
├── frontend/         # React前端
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api.ts
│   └── Dockerfile
└── docker-compose.yml
```

## 主要功能说明

### 任务管理
- 支持创建主任务和子任务
- 任务可分配给多个执行者
- 支持添加关注者
- 任务历史记录追踪

### 团队协作
- 创建团队并添加成员
- 团队任务共享
- 任务评论功能

### 通知系统
- 任务截止提醒
- 状态变更通知
- 实时消息推送

## 环境变量

后端环境变量（`.env`）：
```
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=todolist
JWT_SECRET=your-secret-key
```

## License

MIT
