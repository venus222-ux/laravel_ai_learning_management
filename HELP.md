# Sprint Goal: LMS Core & AI MVP

## Objective

Enable learners to:

- Log in to the platform
- Browse and enroll in courses
- Read lessons
- Use AI-powered learning assistance
- Track progress
- Earn a completion certificate

---

# User Journey

## 1. Browse Courses

- View course catalog
- Search and filter courses
- Explore categories and learning paths

⬇

## 2. Enroll in a Course

- One-click enrollment
- Course added to student dashboard
- Progress tracking initialized

⬇

## 3. Start Learning

- Open course details
- View ordered syllabus
- Access lessons sequentially

⬇

## 4. Learn with AI Assistance

### AI Features

✅ Lesson Summary

- Generate concise lesson summaries

✅ Quick Quiz

- Create practice questions instantly

✅ Key Concepts

- Extract important learning points

⬇

## 5. Track Progress

- Mark lessons as completed
- Calculate completion percentage
- Update student learning status

⬇

## 6. Earn Certificate

- Automatically triggered at 100% completion
- PDF certificate generated in background
- Stored and available for download

---

# LMS Architecture Overview

Frontend (React + TypeScript)

↓

Laravel API

↓

Business Logic Layer

- Controllers
- Policies
- Services
- Jobs
- Events

↓

Data Layer

- MySQL
- MongoDB

↓

AI Services

- Groq / Llama Models

---

# AI Content Generation Flow

Student clicks:

"Generate Quiz" or "Summarize Lesson"

↓

LMS Controller

↓

Background Queue Job

↓

AI Service

↓

Groq / Llama API

↓

Response Generated

↓

Interaction Stored (MongoDB)

↓

Real-Time Event Broadcast

↓

Laravel Echo + Pusher

↓

Instant Update in React UI

---

# Technical Components

### Controllers

Handle incoming API requests

### Policies

Manage course and lesson access

### Services

Communicate with external AI providers

### Jobs

Execute heavy tasks asynchronously

### Events

Enable real-time updates

### MongoDB

Store AI interactions and history

### Queues

Improve performance and scalability

### PDF Generator

Create completion certificates

---

# Sprint Success Criteria

A student can:

✓ Log in

✓ Browse courses

✓ Enroll in a course

✓ Read lessons

✓ Generate AI summaries

✓ Generate AI quizzes

✓ Track learning progress

✓ Receive a completion certificate

✓ Experience real-time AI updates
