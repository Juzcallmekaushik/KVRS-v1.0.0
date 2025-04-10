# KVRS – Kasturi Vijayam Registration System

This is a [Next.js](https://nextjs.org) project built for managing registrations for the Kasturi Vijayam event. It features both **Public** and **Host** components, integrates with **Google Authentication**, and stores user data in **Supabase**.

---

## 🚀 Features

### 🔓 Public Component
- **Google Sign-In** for easy authentication  
- **Automatic user detail fetching** (name & phone) via Google  
- **Conditional form rendering** – asks only for missing fields  
- **Supabase integration** for secure and persistent data storage  
- **Post-registration display** showing:
  - User info  
  - Event details  
  - A lucky number draw  
  - Logout button  
- Once registered, pre- and registration pages are blocked unless the host resets the user data

### 🔐 Host Component
- Authenticated and restricted access  
- Compact view of all registered users and their post-registration info

---

## 🧑‍💻 Getting Started

### Prerequisites

- Node.js ≥ 18  
- Supabase project  
- Google OAuth credentials  
- Vercel account (for deployment)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/kvrs-v1.git
cd kvrs-v1
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

---

## 🧰 Tech Stack

- **Next.js App Router**  
- **Supabase** (Database + Auth)  
- **Google OAuth**  
- **Tailwind CSS**  
- **Geist Font**

---

## 🚢 Deployment

Deploy directly using [Vercel](https://vercel.com):

1. Push your project to GitHub  
2. Connect the repo to Vercel  
3. Add environment variables in the Vercel dashboard  
4. Deploy 🚀

For more help, see: [Next.js Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying)

---

## 🛡️ License

© 2025 Kaushik Reddy. All rights reserved.
