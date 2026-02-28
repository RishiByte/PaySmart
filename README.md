# PaySmart
### Smart Peer-to-Peer Expense Splitter with Debt Optimization

> A graph-based expense settlement system that minimizes redundant transactions using a minimum cash flow algorithm.

---

# Project Title
**PaySmart – Peer-to-Peer Expense Splitter with Debt Simplification**

**One-line Project Description:**  
A smart expense-sharing platform that reduces unnecessary payment chains by applying graph-based optimization to minimize total settlement transactions.

---

# 1. Problem Statement

## Problem Title
Peer-to-Peer Expense Splitter with Debt Simplification
## Problem Description
Shared expenses among flatmates, travel groups, colleagues, and families often create complex debt chains. Most existing expense-sharing tools only calculate balances but fail to optimize settlements, leading to redundant transactions and confusion.

Common challenges:
- Complex debt loops among participants
- Redundant payment chains
- Lack of clarity on who owes whom
- Recurring expenses complexity
- Partial payment management
- Currency rounding edge cases

There is no intelligent optimization layer that simplifies settlements using graph-based algorithms.

## Target Users
- College students sharing rent
- Travel groups
- Flatmates
- Small teams
- Families managing shared expenses

## Existing Gaps
- No transaction minimization
- No optimization algorithm
- No graph visualization
- No structured debt simplification
- Manual and inefficient settlement process

---

# 2. Problem Understanding & Approach

## Root Cause Analysis
Debt complexity occurs because:
- Expenses are recorded separately
- Cross-payments create cycles
- No netting of balances
- No settlement optimization logic

This increases transaction count unnecessarily.

## Solution Strategy
1. Record all expenses clearly
2. Compute net balance for each participant
3. Apply a Minimum Cash Flow Algorithm
4. Generate optimized settlement transactions
5. Visualize before and after optimization

---

# 3. Proposed Solution

## Solution Overview
PaySmart intelligently reduces group payment complexity by minimizing the number of transactions required to settle debts.

## Core Idea
Transform messy multi-party debt chains into the smallest possible number of transactions using a greedy graph-based optimization approach.

## Key Features
- Add participants
- Log shared expenses
- Equal and custom splits
- Net balance calculation
- Minimum transaction optimization
- Debt graph visualization (before & after)
- Partial payment handling
- Currency rounding safety

---

# 4. System Architecture

## High-Level Flow
User → Frontend → Backend → Optimization Engine → Database → Response

## Architecture Description
- Frontend collects user inputs and displays results
- Backend processes expense and balance calculations
- Optimization Engine runs minimum cash flow algorithm
- Database stores users, expenses, transactions
- Response returns optimized settlements to UI

## Architecture Diagram
<img src="./Img/Arch Diagram.png">

---

# 5. Database Design

## ER Diagram
<img src="./Img/ER diagram.png">

## ER Diagram Description
Entities:
- Users
- Groups
- Expenses
- Transactions

Relationships:
- One Group → Many Users
- One Expense → One Payer
- One Expense → Many Participants
- Transactions store optimized settlements

---

# 6. Dataset Selected

## Dataset Name
User-Generated Expense Data

## Source
Application Input

## Data Type
Structured financial transaction data

## Selection Reason
The system processes real-time user-generated expense data.

## Preprocessing Steps
- Validate numeric inputs
- Handle rounding precision (2 decimal places)
- Normalize split shares
- Ensure total balance equals zero

---

# 7. Model Selected

## Model Name
Minimum Cash Flow Algorithm (Greedy Approach)

## Selection Reasoning
- Minimizes total transactions
- Efficient and deterministic
- Suitable for real-time execution
- Easy to scale for small-medium groups

## Alternatives Considered
- Linear programming optimization
- Network flow algorithms
- Cycle detection algorithms

## Evaluation Metrics
- Reduction in transaction count
- Accuracy of settlement
- Algorithm execution time

---

# 8. Technology Stack

## Frontend
- HTML
- CSS
- JavaScript / React

## Backend
- Node.js / Express

## ML/AI
- Algorithm-based optimization (No ML model)

## Database
- MongoDB / PostgreSQL

## Deployment
- Vercel / Localhost / Netlify

---

# 9. API Documentation & Testing

## API Endpoints List

### Endpoint 1: Add Expense
POST /add-expense

### Endpoint 2: Get Balances
GET /balances

### Endpoint 3: Optimize Settlement
GET /optimize

## API Testing Screenshots
(Add Postman or Thunder Client screenshots here)

---

# 10. Module-wise Development & Deliverables

## Checkpoint 1: Research & Planning
Deliverables:
- Problem analysis
- Algorithm design
- UI wireframes

## Checkpoint 2: Backend Development
Deliverables:
- Expense logging API
- Balance calculation logic

## Checkpoint 3: Frontend Development
Deliverables:
- User interface
- Expense entry forms
- Balance display table

## Checkpoint 4: Model Implementation
Deliverables:
- Minimum cash flow algorithm
- Settlement reduction engine

## Checkpoint 5: Model Integration
Deliverables:
- Backend integration
- API connection to frontend

## Checkpoint 6: Deployment
Deliverables:
- Hosted application
- Public GitHub repository

---

# 11. End-to-End Workflow
1. User creates group
2. Adds participants
3. Logs expenses
4. System calculates net balances
5. Optimization engine runs
6. Settlement plan generated
7. Visualization displayed

---

# 12. Demo & Video

Live Demo Link:
(Add link here)

Demo Video Link:
(Add link here)

GitHub Repository:
https://github.com/RishiByte/PaySmart

---

# 13. Hackathon Deliverables Summary
- Functional expense logging system
- Optimized settlement engine
- Graph visualization
- API documentation
- Deployed demo

---

# 14. Team Roles & Responsibilities

| Member Name | Role | Responsibilities |
|-------------|------|-----------------|
| Rishi Bhardwaj | Backend & Algorithm | Optimization logic, APIs |
| Abhyuday Singh Dhapola | Frontend | UI design & visualization |
| Ipsit Debnath | Database & Testing | Schema design & API testing |

---

# 15. Future Scope & Scalability

## Short-Term
- Mobile responsive UI
- Multi-currency support
- Export settlement summary as PDF

## Long-Term
- Payment gateway integration
- Blockchain-based transaction ledger
- AI-based expense categorization
- Multi-group support

---

# 16. Known Limitations
- Greedy algorithm minimizes transaction count but not total transfer volume
- Designed for small-to-medium groups
- No real-time payment integration

---

# 17. Impact
- Reduces unnecessary financial transactions
- Improves settlement transparency
- Saves time in coordination
- Demonstrates practical graph optimization in real-world finance