# 🤖 EduTech CRM & AI Chatbot Automation

![n8n](https://img.shields.io/badge/n8n-Workflow-orange?style=flat-square&logo=n8n)
![OpenAI](https://img.shields.io/badge/AI-OpenAI_GPT_4-blue?style=flat-square&logo=openai)
![Supabase](https://img.shields.io/badge/Database-Supabase_PgVector-green?style=flat-square&logo=supabase)
![ngrok](https://img.shields.io/badge/Tunnel-ngrok-black?style=flat-square&logo=ngrok)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)

A comprehensive automation workflow designed for **Educational Centers (EduTech)** using **n8n**. This system integrates an AI-powered Chatbot (RAG), automated CRM lead capture, and a dynamic document ingestion pipeline, all exposed to the public internet via **ngrok**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Database Setup](#-database-setup-supabase)
- [Installation & Configuration](#-installation--configuration)
    - [1. Import Workflow](#1-import-workflow)
    - [2. Configure Credentials](#2-configure-credentials)
    - [3. Ngrok Setup (Important)](#3-ngrok-setup-important)
- [How It Works](#-how-it-works)
- [Contributing](#-contributing)

---

## 🔭 Overview

This project automates customer support and sales processes. It listens to messages from Zalo (via webhook), uses OpenAI to classify intent, consults internal documents stored in Google Drive to answer questions, and automatically logs qualified leads into Google Sheets.

---

## 🚀 Key Features

### 🧠 **Intelligent Orchestrator**
- **Intent Classification:** Uses AI to categorize messages into `Sales` (Inquiry), `Billing` (Purchase), or `Other` (Chit-chat).
- **Entity Extraction:** Automatically extracts **Customer Name**, **Phone Number**, and **Course Interest**.

### 📚 **RAG Sales Consultant**
- **Knowledge Base:** Connected to Supabase Vector Store.
- **Context Aware:** Remembers conversation history for natural interactions.
- **Source:** Answers based on real-time PDF/Excel/Docx files from your Google Drive.

### 💼 **Automated Billing CRM**
- **Smart Data Collection:** If a user wants to buy but hasn't provided a phone number, the AI politely asks for it.
- **Sync:** Once data is complete, it appends the lead to **Google Sheets**.

### 🔄 **Auto-Ingestion Pipeline**
- **Drive Watcher:** Monitors a Google Drive folder for new files.
- **Vectorization:** Automatically downloads, chunks, embeds, and stores document vectors.
- **Sync Deletion:** If a file is deleted from Drive, its vectors are removed from the database to ensure accuracy.

---

## 🏗 System Architecture

The workflow runs on **n8n** (localhost) and uses **ngrok** to receive webhooks from the internet.
![Architecture](https://res.cloudinary.com/vinhisreal/image/upload/v1766130994/CRM-n8n.drawio_yfppsc.png)
## 📋 Prerequisites
Before you begin, ensure you have:  
n8n: Installed locally or via Docker.  
Supabase Account: For PostgreSQL and Vector database.  
OpenAI API Key: For GPT-4o-mini/GPT-3.5 and Embeddings.  
Google Cloud Console: Enabled Drive API and Sheets API.  
ngrok: Installed and authenticated.  
Zalo OA (Zapps): To receive messages.  
## 🗄 Database Setup (Supabase)
Run the following SQL commands in your Supabase SQL Editor to initialize the required tables:
SQL
```bash
-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Chat History Table
CREATE TABLE IF NOT EXISTS n8n_chat_histories_crm (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    message JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Document Metadata Table (File Tracking)
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
Step A: Start ngrok Open your terminal and run (assuming n8n runs on port 5678):
```bash
ngrok http 5678
```
Step B: Get the URL Copy the HTTPS forwarding URL provided by ngrok, e.g., https://a1b2-c3d4.ngrok-free.app.  

Step C: Update n8n Webhook  
In the n8n canvas, find the node named Set Production WEBHOOK (or Set Test WEBHOOK).
Update the url parameter field. Format:  
https://<your-ngrok-id>.ngrok-free.app/webhook/<your-n8n-webhook-uuid>  
(Note: You can find the <your-n8n-webhook-uuid> in the "When chat message received" trigger node).  
Execute the "Set Production WEBHOOK" node manually once to register this URL with the Zalo API.  
⚠️ Warning: If you are using the free version of ngrok, the URL changes every time you restart the terminal. You must update the URL in n8n and re-execute the set-webhook node each time.

## 🎮 How It Works
Ingestion: Upload a PDF to your connected Google Drive folder. n8n will detect it, extract text, and save vectors to Supabase.  
Chatting:  
User asks: "How much is the IELTS course?"  
Orchestrator detects Sales.  
Sales Agent queries Supabase -> Finds the price in the PDF -> Answers the user.  
Closing:  
User says: "I want to register."  
Orchestrator detects Billing.  
Billing Agent checks if Name/Phone is known. If not, it asks.  
Once confirmed, data is saved to Google Sheets.  
## 🤝 Contributing
Contributions are welcome!  
Fork the Project.  
Create your Feature Branch (git checkout -b feature/AmazingFeature).  
Commit your Changes (git commit -m 'Add some AmazingFeature').  
Push to the Branch (git push origin feature/AmazingFeature).  
Open a Pull Request.  
  