# 📊 VCD Observable Project

This is an [Observable Framework](https://observablehq.com/framework/) (ob_fw) app. The public application is available at:  
👉 https://lsdyi.github.io/vcd_observable/

## 🚀 Getting Started

Install the required dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

🖥️ A local web server will run on **port 3000**.  
Visit 👉 http://localhost:3000 to interact with the app.

🔁 The server uses **WebSocket live reload**, so changes appear instantly after saving — no refresh needed.

## 🗂️ Project Structure

```ini
.
├─ src
│  ├─ components
│  │  └─ getRanges.js           # ♻️ reusable logic
│  ├─ data
│  │  ├─ launches.csv.js        # 📥 data loader
│  │  └─ events.json            # 🧾 static data
│  ├─ pca.md                    # 📄 page (compiled to HTML)
│  ├─ vcd_v0.md                 # 📄 page
│  └─ index.md                  # 🏠 home page
├─ .gitignore
├─ observablehq.config.js       # ⚙️ app configuration
├─ package.json
└─ README.md
```

## 🔄 CI / CD

### 🚢 Continuous Deployment

Every commit to `main` triggers **GitHub Actions** to:

1. 🛠️ Build the project
2. 📦 The building output is web files and will be put in branch `docs/building_output`
3. 🌍 Deploy via **GitHub Pages**

🔗 Github Page/Website:  
https://lsdyi.github.io/vcd_observable/

📂 Pipeline config:  
`.github/workflows/deploy_docs.yml`
