# OnlineBiddingWeb-23_KTPM_HCMUS

# AuctionHub: Auction Platform with Scheduled Bid Updates

AuctionHub is a 2-person project, defined as a high-performance auction platform designed to manage auctions efficiently. It features scheduled bid updates via cron, automated email notifications, secure payment processing, and a wide selection of products for users to bid on.

---

## Features
* **Scheduled Bid Updates:** Auction end times are automatically updated every minute using cron jobs.
* **Outbid Notifications:** Users are notified via email if their bid is surpassed.
* **Winning Payment Flow:** Integrated payment handling for winning bidders.
* **Watchlist & History:** Users can track favorite items and view their bidding history.
* **Secure Authentication:** Users login via JWT or session-based authentication.

---

## 🛠 Tech Stack

| Layer            | Technology                  |
| :--------------- | :-------------------------- |
| **Frontend**      | Handlebars, Bootstrap, HTML |
| **Backend**       | Node.js, Express            |
| **Database**      | PostgreSQL                  |
| **Auth**          | JWT / Session               |
| **Email**         | Nodemailer                  |
| **Task Scheduler**| Node-Cron                   |

---

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/giabao1509/OnlineBiddingWeb-23_KTPM_HCMUS.git
cd OnlineBiddingWeb-23_KTPM_HCMUS
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory, based on the template `.env.example`:

```env
# Database configuration
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

# Email configuration
EMAIL_USER=
EMAIL_PASS=

# reCAPTCHA
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# JWT / Auth
JWT_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=

# Cloudinary (for image upload)
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=

# Session
SESSION_SECRET_KEY=
```

4. **Start the development server**
```bash
npm run dev
```

---

## Notes
- Auction end times are updated **every minute** by a cron job (`node-cron`).
- The platform does **not** use real-time updates via WebSocket; all bid updates are handled server-side via scheduled tasks.

