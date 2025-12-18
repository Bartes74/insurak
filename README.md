# Insurak - Insurance Asset Management

Insurak is a web application designed to manage company assets and their insurance policies. It allows tracking of vehicles, machinery, and other assets, monitoring policy statuses (active, expiring, expired), and managing policy documents.

## Tech Stack

### Client
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context (AuthContext)
- **HTTP Client**: Axios

### Server
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod

## Project Structure

- `/client` - React frontend application.
- `/server` - Express backend API.

## Setup & Installation

### Prerequisites
- Node.js (v16+)
- npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Bartes74/insurak.git
    cd insurak
    ```

2.  **Install Client Dependencies:**
    ```bash
    cd client
    npm install
    ```

3.  **Install Server Dependencies:**
    ```bash
    cd ../server
    npm install
    ```

4.  **Database Setup:**
    Initialize the SQLite database using Prisma.
    ```bash
    # Inside /server directory
    npx prisma migrate dev --name init
    ```

### Configuration (.env)

**Server (`server/.env`):**
Create a `.env` file in the server directory with:
```env
PORT=5001
# Use a strong secret in production
JWT_SECRET="dev-secret-change-me-in-prod"
DATABASE_URL="file:./dev.db"

# Rate Limiting (Requests per 15 min)
AUTH_RATE_MAX=100
UPLOAD_RATE_MAX=50

# Email Configuration (Required for notifications & invites)
# If missing, emails will be logged to the server console instead.
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="user@example.com"
SMTP_PASS="password"
APP_URL="http://localhost:3000" # URL of the Client App (for links in emails)
```

**Client (`client/.env`):**
Typically handled by Vite, defaults to localhost:3000 proxying to 5001.

## Running the Application

1.  **Start the Server:**
    ```bash
    cd server
    npm run dev
    ```
    The server runs on `http://localhost:5001`.

2.  **Start the Client:**
    ```bash
    cd client
    npm run dev
    ```
    The client runs on `http://localhost:3000`.

## Features
- **Authentication**: Email/Password login with JWT.
- **Asset Management**: Create, edit, and delete assets.
- **Policy Tracking**: Monitor policy expiration, calculate progress bars.
- **File Upload**: Attach PDF/Images to policies.
- **Role-based Access**: Admin vs User roles (Admins can manage users).
- **Zod Validation**: Strict input validation on the server.

## Security Features (Phase 1 Implemented)
- **Centralized Config**: No hardcoded secrets.
- **Type Safety**: Full TypeScript support including `req.user`.
- **Input Validation**: All endpoints validated with Zod.
- **Rate Limiting**: Protection against brute-force attacks.
