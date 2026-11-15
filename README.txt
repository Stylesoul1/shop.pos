DUKAN POS - Multi-shop server (signup + admin approval)

KAISE CHALAYEIN (apne computer par)
1. Node.js 18+ install karein (nodejs.org).
2. Is folder me terminal kholein:
     npm install
     ADMIN_EMAIL=aap@email.com ADMIN_PASSWORD=koi-mazboot-password npm start
   (Windows PowerShell:  $env:ADMIN_EMAIL="aap@email.com"; $env:ADMIN_PASSWORD="password"; npm start)
3. Browser me http://localhost:3000 kholein aur admin email/password se login karein.

INTERNET PAR LAGANA (Render.com misal)
- Folder GitHub par daalein, Render me "New Web Service" banayein.
- Build Command: npm install    Start Command: npm start
- Environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, DATA_DIR=/var/data
- Render me ek "Disk" attach karein (mount path /var/data), warna restart par data mit jata hai.
- HTTPS khud lag jata hai. Dusre hosts (Railway, VPS) par bhi yehi tareeqa hai.

KAISE KAAM KARTA HAI
- Dukandar Signup karta hai -> status "Intizar". Aap admin account se "Owners" tab me Approve karte hain.
- Approve hone ke baad hi wo login kar sakta hai. Reject/Block se login band ho jata hai.
- Har dukan ka inventory, orders aur invoices alag save hote hain.
- Offline: login ke baad internet na ho to bhi sale chalti hai. Internet aate hi data server par sync ho jata hai.
- Naya login karne ke liye internet zaroori hai.

NOTE
- Data data/data.json me hota hai. Is file ka regular backup rakhein.
- Ek hi dukan ko 2 devices par saath saath chalane par aakhri save wala data jeetta hai.
