# 🎓 EduAI — Complete Deployment Guide
## Domain: clatone.co.in | Using: Cloudflare Tunnel + Laptop

---

## 📋 What You Have
- ✅ Domain: `clatone.co.in` (on Hostinger)
- ✅ App: Spring Boot backend + React frontend
- ✅ Database: H2 file-based (runs on your laptop, no external DB needed)
- ✅ Admin login: `admin` / `LetsaimtotheMoon@24`

## 📋 What You Need
- ☐ Gemini API Key (free): https://aistudio.google.com/app/apikey
- ☐ Cloudflare account (free): https://dash.cloudflare.com/sign-up
- ☐ Homebrew on your Mac (to install cloudflared)

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### STEP 1: Get Your Gemini API Key (2 minutes)

1. Go to https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy the key (starts with `AIza...`)
4. Save it somewhere safe — you'll need it in Step 5

---

### STEP 2: Create a Cloudflare Account (3 minutes)

1. Go to https://dash.cloudflare.com/sign-up
2. Sign up with email + password
3. Once logged in, you'll see the Cloudflare dashboard

---

### STEP 3: Add Your Domain to Cloudflare (5 minutes)

1. In Cloudflare dashboard, click **"Add a site"**
2. Enter: **`clatone.co.in`**
3. Select the **Free plan** → click **Continue**
4. Cloudflare will scan your existing DNS records. It will show your existing records. Click **Continue**
5. Cloudflare will give you **two nameservers**, something like:
   ```
   aria.ns.cloudflare.com
   duke.ns.cloudflare.com
   ```
   **Write these down!**

---

### STEP 4: Change Nameservers in Hostinger (5 minutes)

Now go to Hostinger and point your domain to Cloudflare:

1. Log in to **Hostinger** → go to **Domains** → click **`clatone.co.in`**
2. Click **"DNS / Nameservers"** (you're already on this page based on your screenshot)
3. Click **"Change Nameservers"**
4. Select **"Change nameservers"** (custom option)
5. Replace the current nameservers:
   ```
   REMOVE: ns1.dns-parking.com
   REMOVE: ns2.dns-parking.com

   ADD: aria.ns.cloudflare.com      ← (use the ones Cloudflare gave YOU)
   ADD: duke.ns.cloudflare.com      ← (use the ones Cloudflare gave YOU)
   ```
6. Click **Save**
7. ⏳ Wait 15-30 minutes for nameserver change to propagate
8. Go back to Cloudflare → it will detect the nameserver change and show **"Active"** ✅

> **Note:** Your existing Hostinger email (MX records) will be re-created in Cloudflare. 
> When Cloudflare scanned your DNS in Step 3, it should have copied them automatically. 
> Verify in Cloudflare DNS that MX records for `mx1.hostinger.com` and `mx2.hostinger.com` exist.

---

### STEP 5: Install Cloudflare Tunnel on Your Mac (5 minutes)

Open **Terminal** on your Mac and run these commands one by one:

```bash
# 1. Install Homebrew (skip if you already have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install cloudflared
brew install cloudflared

# 3. Login to Cloudflare (this opens a browser window)
cloudflared login
```

When `cloudflared login` runs:
- A browser window opens
- Select your domain **`clatone.co.in`**
- Click **Authorize**
- Terminal will say "You have successfully logged in" ✅

---

### STEP 6: Create the Tunnel (3 minutes)

```bash
# Create a tunnel named "eduai"
cloudflared tunnel create eduai
```

This will output something like:
```
Created tunnel eduai with id abcd1234-5678-90ef-ghij-klmnopqrstuv
```

**Copy that tunnel ID!** (the long string like `abcd1234-5678-90ef-ghij-klmnopqrstuv`)

---

### STEP 7: Configure the Tunnel (3 minutes)

Create the config file:

```bash
# Create the config directory if it doesn't exist
mkdir -p ~/.cloudflared

# Create the config file
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: eduai
credentials-file: /Users/YOUR_MAC_USERNAME/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: clatone.co.in
    service: http://localhost:8080
  - hostname: www.clatone.co.in
    service: http://localhost:8080
  - service: http_status:404
EOF
```

**⚠️ IMPORTANT: Edit the file to replace:**
- `YOUR_MAC_USERNAME` → your actual Mac username (run `whoami` in terminal to find it)
- `TUNNEL_ID` → the tunnel ID from Step 6

You can edit it with:
```bash
nano ~/.cloudflared/config.yml
```
(Save with `Ctrl+O`, then `Enter`, then `Ctrl+X` to exit)

---

### STEP 8: Connect Domain to Tunnel (2 minutes)

```bash
# This creates a CNAME record in Cloudflare DNS pointing to your tunnel
cloudflared tunnel route dns eduai clatone.co.in

# Also add www subdomain
cloudflared tunnel route dns eduai www.clatone.co.in
```

You'll see: `Successfully routed DNS` ✅

---

### STEP 9: Build & Start Your App (5 minutes)

```bash
# Navigate to your project
cd /Users/prashantprakash/Desktop/EDU_AI_PROTOTYPE

# Set your Gemini API key (the one from Step 1)
export GEMINI_API_KEY=AIza_YOUR_ACTUAL_KEY_HERE

# Start the production build + server
./start-prod.sh
```

Wait until you see: `Started EduAiApplication` in the terminal output.

---

### STEP 10: Start the Tunnel (1 minute)

Open a **NEW terminal tab** (Cmd+T) and run:

```bash
cloudflared tunnel run eduai
```

You'll see logs showing connections being established. Leave this running.

---

### STEP 11: Test It! 🎉

1. Open your browser
2. Go to **https://clatone.co.in**
3. You should see your EduAI login page!
4. Login with:
   - Username: **admin**
   - Password: **LetsaimtotheMoon@24**

**Congratulations — you're LIVE!** 🚀

---

## 📝 Daily Usage

Every time you want to make the app live, you need 2 terminals running:

### Terminal 1: Start the app
```bash
cd /Users/prashantprakash/Desktop/EDU_AI_PROTOTYPE
export GEMINI_API_KEY=AIza_YOUR_KEY_HERE
./start-prod.sh
```

### Terminal 2: Start the tunnel
```bash
cloudflared tunnel run eduai
```

### Keep laptop awake
```bash
# Run this BEFORE the start script to prevent your Mac from sleeping:
caffeinate -s &
```

Or: **System Settings → Displays → Advanced → Prevent automatic sleeping when display is off**

### To stop everything
- Press `Ctrl+C` in both terminals

---

## 🔧 Useful Commands

```bash
# Check your Mac username
whoami

# Check if port 8080 is in use
lsof -i :8080

# Kill a process on port 8080
kill -9 $(lsof -t -i:8080)

# Check tunnel status
cloudflared tunnel info eduai

# List all tunnels
cloudflared tunnel list

# Check if your domain resolves
nslookup clatone.co.in

# Test your backend locally
curl http://localhost:8080/graphql -X POST -H "Content-Type: application/json" -d '{"query":"{ systemStatus }"}'
```

---

## ⚠️ Important Reminders

| Thing | Details |
|-------|---------|
| **Laptop must be ON** | App stops when laptop sleeps/shuts down |
| **Both terminals** | You need app + tunnel running simultaneously |
| **Database backup** | Copy `server/data/edudb.mv.db` to Google Drive regularly |
| **Gemini API free tier** | 15 requests/minute — fine for small usage |
| **HTTPS** | Cloudflare provides it automatically — no setup needed! |

---

## 📋 Your Credentials (Reference)

| What | Value |
|------|-------|
| Domain | `clatone.co.in` |
| Admin Username | `admin` |
| Admin Password | `LetsaimtotheMoon@24` |
| Admin Email | `admin@clatone.co.in` |
| DB file location | `server/data/edudb.mv.db` |
| DB Console (local only) | `http://localhost:8080/h2-console` |
| DB Username | `sa` |
| DB Password | `password` |
| Server Port | `8080` |

---

## 🔄 Future: If You Outgrow Your Laptop

When you get more users and need 24/7 uptime without your laptop:

### Option A: Hostinger VPS (~$5/month)
- Get Ubuntu VPS (2GB RAM)
- Install Java 21 + Node.js
- Clone repo, use the Docker Compose setup already in your project
- Point `clatone.co.in` A record to VPS IP

### Option B: AWS (more complex, $20-50/month)
- EC2 for backend, S3+CloudFront for frontend
- RDS for database
- Only worth it if you have many users

**But for now — laptop + Cloudflare Tunnel is perfect!** ✅
