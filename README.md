# 🤖 Automated CRM & IT Support Ticket Agent

![n8n](https://img.shields.io/badge/n8n-Workflow-orange?style=flat-square&logo=n8n)
![OpenAI](https://img.shields.io/badge/AI-OpenAI_GPT_4-blue?style=flat-square&logo=openai)
![Supabase](https://img.shields.io/badge/Database-Supabase_PgVector-green?style=flat-square&logo=supabase)
![Notion](https://img.shields.io/badge/Log-Notion-black?style=flat-square&logo=notion)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)

> [cite_start]**Project Timeline:** 08/2025 – 10/2025 [cite: 30]

A centralized automation workflow designed to streamline IT Support and CRM operations. [cite_start]This system acts as a **central router** to classify user requests, dispatch them to specialized sub-agents, and maintain a synchronized knowledge base for automated troubleshooting[cite: 31, 32].

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Database Setup](#-database-setup-supabase)
- [Installation & Configuration](#-installation--configuration)
- [How It Works](#-how-it-works)

---

## 🔭 Overview

This project was developed to automate the handling of incoming user inquiries (via Zalo/Webhooks). [cite_start]It utilizes **OpenAI** to classify requests into **Technical Support** or **Billing**, consults an internal knowledge base (RAG) for automated answers, and utilizes **Notion** to log system errors and track resolution status[cite: 31, 33].

---

## 🚀 Key Features

### 🧠 **Central Routing System (Ticketing)**
- **Intelligent Classification:** Acts as a central router to classify incoming user requests into distinct categories: **Technical Support** or **Billing**.
- **Auto-Dispatch:** Automatically generates and dispatches support tickets to the appropriate specialized sub-agents based on the intent.

### 📚 **Event-Driven ETL Pipeline (Knowledge Base)**
- **Drive Monitoring:** Engineered an event-driven pipeline that monitors a designated Google Drive folder for new documentation.
- [**Auto-Ingestion:** Ensures automatic file ingestion and synchronization with the system's knowledge base (Supabase Vector Store), allowing the AI to answer based on the latest internal documents.

### 🛠 **Admin & Error Tracking**
- **Notion Integration:** Utilizes **Notion** to log system errors and track the resolution status of complex tickets.
- **Response Optimization:** Helps improve response time for end-user inquiries by organizing logs and status updates centrally.

---

## 🏗 System Architecture

The workflow runs on **n8n** (localhost) and uses **ngrok** to expose webhooks to the public internet.

1.  **Input:** User messages via Webhook (Zalo/Chat Interface).
2.  **Processing:** n8n Orchestrator uses OpenAI to classify intent.
3.  **Data & RAG:**
    * **Supabase:** Stores vector embeddings of documents.
    * **Google Drive:** Source of truth for documentation (ETL Pipeline).
4.  **Output/Logging:**
    * **Notion:** Logs errors and ticket status.
    * **Response:** AI generates a context-aware reply to the user.

---

## 📋 Prerequisites

Before you begin, ensure you have:
- **n8n**: Installed locally or via Docker.
- **Supabase Account**: For PostgreSQL and Vector database.
- **OpenAI API Key**: For GPT-4o-mini/GPT-3.5 and Embeddings.
- **Google Cloud Console**: Enabled Drive API (for ETL pipeline).
- **Notion API Key**: For logging system errors.
- **ngrok**: Installed and authenticated.

---

## 🗄 Database Setup (Supabase)

Run the following SQL commands in your Supabase SQL Editor to initialize the required tables:

```sql
-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Chat History Table
CREATE TABLE IF NOT EXISTS n8n_chat_histories_crm (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    message JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Document Metadata Table (File Tracking for ETL)
CREATE TABLE IF NOT EXISTS document_metadata (
    id TEXT PRIMARY KEY, -- Google Drive File ID
    title TEXT,
    url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    schema TEXT
);

-- 4. Vector Store Table
CREATE TABLE IF NOT EXISTS documents (
    id bigserial primary key,
    content text,
    metadata jsonb,
    embedding vector(1536) -- Matches OpenAI text-embedding-3-small
);

-- 5. Similarity Search Function
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query(
    select
      documents.id,
      documents.content,
      documents.metadata,
      1 - (documents.embedding <=> query_embedding) as similarity
    from documents
    where 1 - (documents.embedding <=> query_embedding) > match_threshold
    order by documents.embedding <=> query_embedding
    limit match_count
  );
end;
$$;
```
## ⚙️ Installation & Configuration
### 1. Import Workflow
Open n8n.
Go to Workflows > Import Workflow.
Upload the .json file from this repository.
### 2. Configure Credentials
Update the nodes with your own credentials:
OpenAI: Connection to your API Key.
Postgres: Host, User, Password, Database (from Supabase Connection settings).
Google Drive & Sheets: OAuth2 Client credentials.
### 3. Ngrok Setup (Important)
Since n8n is running locally, Zalo cannot send webhooks to localhost. We use ngrok to tunnel the connection.  
- Step A: Start ngrok Open your terminal and run (assuming n8n runs on port 5678):
```bash
ngrok http 5678
```
- Step B: Get the URL Copy the HTTPS forwarding URL provided by ngrok, e.g., https://a1b2-c3d4.ngrok-free.app.  

- Step C: Update n8n Webhook  
  In the n8n canvas, find the node named Set Production WEBHOOK (or Set Test WEBHOOK).
  Update the url parameter field. Format:  
  https://<your-ngrok-id>.ngrok-free.app/webhook/<your-n8n-webhook-uuid>  
( Note: You can find the <your-n8n-webhook-uuid> in the "When chat message received" trigger node).  
  Execute the "Set Production WEBHOOK" node manually once to register this URL with the Zalo API.  
⚠️ Warning: If you are using the free version of ngrok, the URL changes every time you restart the terminal. You must update the URL in n8n and re-execute the set-webhook node each time.

## 🎮 How It Works
Ingestion: Upload a PDF to your connected Google Drive folder. n8n will detect it, extract text, and save vectors to Supabase.  
Chatting:  
- User asks: "How much is the IELTS course?"  
- Orchestrator detects Sales.  
- Sales Agent queries Supabase -> Finds the price in the PDF -> Answers the user.  
Closing:  
- User says: "I want to register."  
- Orchestrator detects Billing.  
- Billing Agent checks if Name/Phone is known. If not, it asks.  
Once confirmed, data is saved to Google Sheets.  
## 🤝 Contributing
Contributions are welcome!  
Fork the Project.  
Create your Feature Branch (git checkout -b feature/AmazingFeature).  
Commit your Changes (git commit -m 'Add some AmazingFeature').  
Push to the Branch (git push origin feature/AmazingFeature).  
Open a Pull Request.  
  
