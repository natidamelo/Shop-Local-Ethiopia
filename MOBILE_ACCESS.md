# View Your Shop on Your Phone

Follow these steps to open your project on your phone (same Wi‑Fi as your PC).

---

## 1. Find your PC's IP address

**Windows (PowerShell or Command Prompt):**
```bash
ipconfig
```
Find **IPv4 Address** under your Wi‑Fi adapter (e.g. `192.168.1.105`). Use this as `YOUR_IP` below.

---

## 2. Allow the frontend to be reached from the network

From the **frontend** folder, run the dev server so it listens on all interfaces:

```bash
cd frontend
npm run dev:mobile
```

Leave this terminal open. The site will be available at `http://YOUR_IP:3000` (e.g. `http://192.168.1.105:3000`).

---

## 3. Point the app to your PC’s IP (for phone use)

Create or edit **frontend/.env.local** and set (use your real IP):

```env
# Use your PC's IP so the phone can reach the API
NEXT_PUBLIC_API_URL=http://YOUR_IP:8001/api
```

Example: if your IP is `192.168.1.105`:
```env
NEXT_PUBLIC_API_URL=http://192.168.1.105:8001/api
```

Keep your other lines (Stripe, PayPal, etc.) as they are. Restart the frontend after changing `.env.local` (`Ctrl+C` then `npm run dev:mobile` again).

---

## 4. Allow the backend to accept requests from the phone (CORS)

In **backend/.env**, set:

```env
CLIENT_URL=http://YOUR_IP:3000
```

Example:
```env
CLIENT_URL=http://192.168.1.105:3000
```

Restart the backend after changing `.env`.

---

## 5. Start backend and frontend

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 – Frontend (for phone access):**
```bash
cd frontend
npm run dev:mobile
```

---

## 6. Open the site on your phone

1. Connect your phone to the **same Wi‑Fi** as your PC.
2. On the phone, open the browser and go to:
   ```text
   http://YOUR_IP:3000
   ```
   Example: `http://192.168.1.105:3000`

You should see your shop. If the page loads but login or data fails, recheck:
- Backend is running and **CLIENT_URL** in backend `.env` is `http://YOUR_IP:3000`.
- **NEXT_PUBLIC_API_URL** in frontend `.env.local` is `http://YOUR_IP:8001/api`.
- Both devices are on the same Wi‑Fi and your firewall allows ports 3000 and 8001.

---

## Optional: Windows Firewall

If the phone cannot connect, allow the ports:

1. Open **Windows Defender Firewall** → **Advanced settings** → **Inbound Rules**.
2. **New Rule** → Port → TCP → Ports **3000** and **8001** → Allow the connection.

Then try `http://YOUR_IP:3000` on the phone again.
