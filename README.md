# AWS RDS + Lambda 整合教學

本專案示範如何在 AWS Lambda 中連接 PostgreSQL RDS 資料庫，並進行基本的 CRUD 操作。

## 目錄

- [前置準備](#前置準備)
- [步驟一：建立 RDS 資料庫](#步驟一建立-rds-資料庫)
- [步驟二：初始化資料庫](#步驟二初始化資料庫)
- [步驟三：建立 Lambda Layer](#步驟三建立-lambda-layer)
- [步驟四：配置 Lambda 函數](#步驟四配置-lambda-函數)
- [測試結果](#測試結果)
- [注意事項](#注意事項)

---

## 前置準備

- AWS 帳號
- 基本的 AWS Console 操作知識
- Node.js 環境（用於建立 Lambda Layer）

---

## 步驟一：建立 RDS 資料庫

### 1. 進入 AWS Console RDS

登入 AWS Console，進入 RDS 服務，點擊「建立資料庫」。

![建立資料庫](images/image1.png)

### 2. 選擇資料庫引擎

選擇 **PostgreSQL** 作為資料庫引擎。

![選擇 PostgreSQL](images/image2.png)

### 3. 配置部署選項

**部署方式：**  
因為僅供練習使用，選擇「單一可用區域部署」即可。

![單一部署](images/image3.png)

**憑證管理：**  
選擇「自我管理」，手動設定主密碼（練習環境不需使用 AWS Secrets Manager）。

![密碼設定](images/image4.png)

### 4. 網路設定

**公開存取：**  
為了方便測試連線，設定資料庫為「可公開存取」（生產環境不建議）。

![公開 IP](images/image5.png)

### 5. 解決子網路錯誤

**錯誤說明：**  
建立時可能遇到「需要至少 2 個可用區域的子網路」錯誤。

![錯誤訊息](images/image6.png)

**解決方法：**  
新增一個子網路（Subnet），確保至少有 2 個可用區域（Availability Zones）。

![新增子網路](images/image7.png)

---

## 步驟二：初始化資料庫

### 1. 取得連線資訊

資料庫建立完成後，到 RDS 控制台取得連線端點（Endpoint）和連線字串。

![連線資訊](images/image8.png)

### 2. 連接資料庫並建立資料表

使用任何 PostgreSQL 客戶端工具（如 pgAdmin、DBeaver）連接資料庫。

**建立使用者表：**

```sql
-- 建立使用者表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,                                  -- 自動遞增的用戶 ID
    username VARCHAR(50) UNIQUE NOT NULL,                   -- 用戶名（唯一、不為空）
    email VARCHAR(100) UNIQUE NOT NULL,                     -- 郵箱（唯一、不為空）
    password VARCHAR(255) NOT NULL,                         -- 密碼（不為空）
    full_name VARCHAR(100),                                 -- 全名（可選）
    age INT,                                                -- 年齡（可選）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,         -- 建立時間
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP          -- 更新時間
);
```

### 3. 插入測試資料

```sql
-- 插入測試資料
INSERT INTO users (username, email, password, full_name, age) VALUES
('john_doe', 'john@example.com', 'hashed_password_1', 'John Doe', 28),
('jane_smith', 'jane@example.com', 'hashed_password_2', 'Jane Smith', 32),
('bob_wilson', 'bob@example.com', 'hashed_password_3', 'Bob Wilson', 25);
```

![建立資料](images/image9.png)

---

## 步驟三：建立 Lambda Layer

### 1. 問題說明

Lambda 函數預設不包含 `pg` 模組，執行時會出現 `module not found` 錯誤。需要建立 Lambda Layer 來提供 PostgreSQL 客戶端依賴。

### 2. 建立 Layer 套件

在本地環境執行以下指令：

```bash
# 建立目錄結構
mkdir -p lambda-layer/nodejs/node_modules
cd lambda-layer/nodejs

# 安裝 pg 模組
npm install pg

# 返回上層並打包成 ZIP
cd ..
zip -r ../pg-layer.zip nodejs/

# 檢查 ZIP 檔案
ls -lh ../pg-layer.zip
```

### 3. 上傳 Layer 到 AWS

1. 進入 AWS Console → **Lambda** → **Layers**
2. 點擊「建立 Layer」
3. 填寫設定：
   - **名稱：** `pg-module`
   - **描述：** `PostgreSQL client for Lambda`
   - **上傳 ZIP 檔案：** 選擇剛才建立的 `pg-layer.zip`

![建立 Layer](images/image10.png)

4. 上傳完成

![Layer 已建立](images/image11.png)

---

## 步驟四：配置 Lambda 函數

### 1. 新增 Layer 到 Lambda

進入你的 Lambda 函數，在「Layers」區塊點擊「新增 Layer」，選擇剛才建立的 `pg-module`。

![新增 Layer](images/image12.png)

### 2. 配置環境變數（建議）

在 Lambda 函數的「配置」→「環境變數」中，設定以下變數：

```
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
```

---

## 測試結果

配置完成後，執行 Lambda 函數，成功連接 RDS 並查詢資料。

![測試成功](images/image13.png)

---

## 注意事項

### 安全性

- **生產環境不建議**將 RDS 設為公開存取
- 密碼應使用 **AWS Secrets Manager** 管理
- Lambda 與 RDS 應配置在同一個 **VPC** 內，並設定適當的**安全群組規則**

### 成本優化

- 本專案僅供學習使用，記得在完成後刪除資源以避免產生費用
- 可使用 **RDS Proxy** 來管理資料庫連線池，減少連線開銷

### 擴展建議

- 使用連線池（如 `pg-pool`）提升效能
- 實作錯誤處理與日誌記錄
- 整合 API Gateway 建立完整的 RESTful API

---

## 參考資料

- [AWS Lambda Layers 官方文件](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
- [node-postgres 文件](https://node-postgres.com/)
- [AWS RDS 最佳實踐](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
