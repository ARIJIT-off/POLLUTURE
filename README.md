# 🌿 Polluture — Ecological Impact Mapper

**Polluture** is an interactive web-based visualization tool that allows users to draw custom zones on a real map of Kolkata and calculate their precise ecological impact. 

By comparing different land-use configurations over time, Polluture helps answer the crucial question: *“What is the true ecological debt of our urban development?”*

## ✨ Features

- **🗺️ Real Interactive Map**: Built on Leaflet.js with OpenStreetMap street and ESRI satellite layers. Centers on Kolkata by default.
- **✏️ Multi-Polygon Drawing**: Draw custom boundaries directly on the map. Select, configure, and manage multiple zones simultaneously.
- **⚙️ Per-Zone Configuration**: Individually configure the land type (Wetland, Dense Vegetation, Agricultural, Open/Bare Land), number of floors, population density, and projection horizon (up to 100 years).
- **⚡ Impact Calculator**: Computes localized Area Quality Index (AQI) deterioration, groundwater drop, and localized temperature rise based on deterministic environmental formulas and the chosen land-use change.
- **📉 Ecological Debt Value**: Calculates a quantifiable "Ecological Debt" in INR (₹) that represents the hidden environmental cost of development.
- **📊 Bottom Drawer Impact Report**: Results for all calculated zones stack horizontally in a collapsible sliding bottom drawer, allowing easy side-by-side comparison.
- **📈 Data Projections**: Uses Chart.js to render mini-charts projecting AQI decline over the chosen timeline.
- **⏱️ 50-Year Narrative Timeline**: Generates a stark, step-by-step narrative outlining how the local environment will degrade progressively over the projection horizon.
- **🏙️ 3D Building Overview**: Renders a dynamic isometric 3D building visual on a canvas overlay at the center of your selected polygon based on your density configurations.
- **⚖️ Compare Mode**: A dedicated modal to view the impact metrics of all zones at a glance.

---

## 🚀 Running on Localhost

Polluture is built entirely with client-side technologies (HTML, CSS, Vanilla JavaScript). There are no Node.js backend dependencies, no build steps, and no required API keys.

To run the application locally, you just need to serve the directory using any basic HTTP server.

### Prerequisites
- [Python](https://www.python.org/downloads/) (comes pre-installed on macOS/Linux and easily installable on Windows)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ARIJIT-off/POLLUTURE.git
   cd POLLUTURE
   ```

2. **Start a local HTTP server:**
   
   If you have **Python 3** installed, run:
   ```bash
   python -m http.server 7788
   ```
   *(If you have Python 2, run `python -m SimpleHTTPServer 7788` instead)*

   Alternatively, if you use **Node.js**, you can use `npx`:
   ```bash
   npx serve -p 7788
   ```

3. **Open in your Browser:**
   Navigate to [http://localhost:7788](http://localhost:7788) in your web browser.

---

## 🛠️ Technology Stack

- **Structure**: HTML5
- **Styling**: Vanilla CSS3 (Custom Dark Glassmorphism Theme)
- **Logic**: Vanilla ES6 JavaScript
- **Mapping**: [Leaflet.js](https://leafletjs.com/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **Animations**: [CountUp.js](https://inorganik.github.io/countUp.js/)

## 📝 License

This project is built for visualizing ecological impacts. Feel free to use, modify, and distribute the code.
