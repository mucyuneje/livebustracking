# 🚌 RebaBus — Real-Time Bus Tracking System

A modern, map-first **Real-Time Bus Arrival System** designed for Kigali, Rwanda.
This system helps passengers **know exactly when the next bus will arrive**, eliminating uncertainty at bus stops.

---

## 🚀 Problem

In Kigali, passengers often wait at bus stops without clear information about:

* When the next bus will arrive
* Which bus is approaching
* How long they need to wait

This leads to:

* Wasted time
* Frustration
* Poor transport experience

---

## 💡 Solution

KigaliBus provides a **real-time, intelligent transport interface** that:

* 📍 Detects user location automatically
* 🗺️ Displays nearby bus stops and routes
* 🚌 Tracks buses in real-time on a map
* ⏱️ Predicts arrival times (ETA)
* 🔔 Allows users to get notified when a bus is near

---

## 🧠 Key Features

### 🗺️ Map-First Experience

* Fullscreen interactive map (Leaflet)
* Clean light theme (OpenStreetMap)
* Real-time moving bus markers

### 📍 Smart Location Detection

* Automatically centers map on user location
* Shows nearby stops within a defined radius

### 🛣️ Route-Based Filtering

* Select a route → shows only:

  * That route’s polyline
  * Stops on that route
  * Buses assigned to that route

### 🚌 Real-Time Bus Simulation

* Smooth GPS-like movement (interpolation)
* Updates every few seconds without jumping

### 📊 Bus Arrival Prediction (ETA)

* Calculates time to next stop
* Displays next 2–3 buses for each stop

### 🔽 Mobile-Friendly UI

* Bottom sliding panel for stop details
* Touch-optimized interactions
* Clean and minimal design

### 🔔 Notification Simulation

* “Notify Me” button
* Alerts user when bus is approaching

---

## 🧱 Tech Stack

### Frontend

* ⚛️ React (Vite)
* 🎨 Tailwind CSS
* 🧩 shadcn/ui
* 🗺️ Leaflet (React-Leaflet)

### Data Layer

* Mock API (local data)
* Real-time simulation logic

### Future Stack (Planned)

* Node.js + Express
* WebSockets (real-time updates)
* Python (AI ETA prediction)

---

## 📁 Project Structure

```
src/
  api/
    mockData.js
  hooks/
    useBusData.js
  utils/
    utils.js
  components/
    BusMap.jsx
    RouteSelector.jsx
    BottomPanel.jsx
    BusCard.jsx
  pages/
    Home.jsx
  App.jsx
  main.jsx
```

---

## ⚙️ Installation & Setup

```bash
# Clone repository
git clone https://github.com/your-username/kigalibus.git

# Navigate to project
cd kigalibus

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 📱 Usage

1. Open the app
2. Allow location access
3. View nearby bus stops and buses
4. Tap a stop to see next arrivals
5. Select a route to filter data
6. Track buses in real-time on the map

---

## 🧭 System Workflow

```
Mock Data → Processing → Frontend State → Map Rendering → User Interaction
```

Future (Real System):

```
Bus GPS → Backend API → WebSocket → Frontend → Map UI → User Decision
```

---

## 🧠 Future Improvements

* 🔗 Real GPS integration from buses
* ⚡ WebSocket real-time updates
* 🤖 AI-based ETA prediction
* 📩 SMS / Push notifications
* 📊 Transport analytics dashboard

---

## 🎯 Vision

To build a **smart mobility system for Kigali** that reduces waiting uncertainty and improves daily public transport experience.

---

## 👨‍💻 Author

**MUCYUNEJE HIRWA Arsene**

* 💻 Software Developer
* 📍 Kigali, Rwanda

GitHub: https://github.com/mucyuneje

---

## 🤝 Contribution

Contributions are welcome!

If you’d like to improve the system:

* Fork the repo
* Create a feature branch
* Submit a pull request

---

## 📜 License

MIT License

---

## ⭐ Final Note

This is not just a project —
it’s a step toward **smarter urban mobility in Kigali**.
