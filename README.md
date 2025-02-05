# Website to EPUB Converter

这是一个可以将网站内容转换为 EPUB 电子书的工具网站。

## 功能特点

- 输入网址，自动抓取网页内容
- 将 HTML 内容转换为 Markdown 格式
- 支持右键导出为 EPUB 电子书
- 数据持久化存储
- 支持递归抓取同域名下的所有相关页面
- 支持批量导出多个页面为一本电子书

## 技术栈

- Next.js 13+
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- cheerio (HTML解析)
- turndown (HTML转Markdown)
- epub-gen-memory (EPUB生成)

## 开始使用

1. 克隆项目：

```bash
git clone [repository-url]
cd website2epub
```

2. 安装依赖：

```bash
# 安装基本依赖
npm install

# 安装工具类依赖
npm install clsx tailwind-merge

# 安装类型定义
npm install --save-dev @types/turndown
```

3. Supabase 数据库配置：

   a. 在 [Supabase](https://supabase.com) 创建新项目
   
   b. 在 SQL 编辑器中创建数据表：

   ```sql
   create table pages (
     id uuid default uuid_generate_v4() primary key,
     title text not null,
     url text not null,
     content text not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```

   c. 获取项目配置信息：
      - 在 Supabase 项目仪表板中，点击左侧菜单的 "Project Settings"
      - 在 "API" 部分可以找到：
        - Project URL: 以 `https://xxxxxxxxxxxxx.supabase.co` 格式的URL
        - anon/public key: 以 `eyJxxxxxxx` 开头的密钥
      - 这两个值分别对应 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. 配置环境变量：

创建 `.env.local` 文件并填入你的 Supabase 配置：

```bash
# Project URL，形如：https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_URL=your_project_url

# anon/public key，形如：eyJxxxxxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

6. 运行开发服务器：

```bash
npm run dev
```

7. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 使用说明

1. 在输入框中输入要抓取的网站URL
2. 点击"开始抓取"按钮，系统会自动抓取该网站及其相关页面
3. 抓取完成后，页面会显示所有抓取到的内容
4. 可以通过以下方式导出EPUB：
   - 右键点击单个页面，选择"导出为EPUB"
   - 点击顶部的"导出全部"按钮，将所有页面合并为一本电子书

## 部署

本项目可以直接部署到 Vercel 平台。部署时需要配置以下环境变量：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/website2epub)

## 注意事项

- 默认最多抓取同一域名下的50个页面
- 只抓取与输入URL同域名的页面
- 导出的EPUB文件会自动移除页面中的脚本、样式、导航、页眉和页脚等非内容元素

## 许可证

MIT
