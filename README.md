 **CampusPrint** 🖨️

CampusPrint is a web-based college printing system that makes it easier for students to place and track printing orders without waiting in long queues.

🌐 **Live Website**

https://campusprint-l7w4.onrender.com

**Features**

 **Student**
- Upload documents for printing
- Choose Black & White or Color printing
- Select the number of copies
- Choose a payment method
- Place and track orders
- View last order and order history
- Prevent duplicate pending orders
- Get notified when an order is ready

**Admin**
- View and manage printing orders
- Download uploaded documents
- Monitor queue position and estimated time
- Mark orders as ready for pickup
- Search orders by register number
- View order history
- Send WhatsApp notification when an order is ready

**Pricing**

| Printing Type | Price |
|---------------|------:|
| Black & White | ₹5 per copy |
| Color | ₹15 per copy |

**Technologies Used**

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- Multer
- Supabase
- Supabase Storage

**How It Works**

```text
Student
   ↓
Upload Document
   ↓
Select Printing Options
   ↓
Place Order
   ↓
Supabase
   ↓
Admin Dashboard
   ↓
Download & Print
   ↓
Mark as Ready
   ↓
WhatsApp Notification
   ↓
Student Pickup
```

**Run Locally**

**1. Clone the repository**

```bash
git clone https://github.com/Alina-108/CampusPrint.git
cd CampusPrint
```

**2. Install dependencies**

```bash
npm install
```

**3. Create a `.env` file**

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

**4. Start the server**

```bash
npm start
```

Open `http://localhost:3000` in your browser.

> **Note:** Keep your `.env` file private and do not upload it to GitHub.

**Deployment**

CampusPrint is deployed using **Render** and uses **Supabase** for the database and file storage.

**College Project**

CampusPrint was developed as a college project to apply practical concepts of web development, backend development, database management, file storage, and deployment.
