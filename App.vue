<template>
  <div class="app">
    <!-- Kopfbereich mit Logo und Theme-Button -->
    <header class="header">
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap" rel="stylesheet">
      <div class="logo">
        <!-- Flugzeug Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="airplane-icon">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
        <!-- App Name mit Neon Effekt -->
        <h1 id="title" class="neon-title" data-text="Departa">Departa</h1>
      </div>
      <!-- Theme Umschalter -->
      <div class="theme-toggle">
        <button @click="toggleTheme">
          <!-- Sonne Icon für Dark Mode -->
          <svg v-if="darkMode" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <!-- Mond Icon für Light Mode -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </div>
    </header>
    
    <!-- Hauptinhalt -->
    <main class="main">
      <!-- Suchbereich für Flughäfen -->
      <div class="search-container">
        <h2>Flüge finden</h2>
        <p class="search-subtitle">Suche nach: Stadt, Flughafen, IATA/ICAO - Code, ...</p>
        <!-- Flughafen Suchkomponente -->
        <AirportSearch @airportSelected="loadFlights" />
      </div>
      
      <!-- Zeigt gewählten Flughafen an -->
      <div v-if="selectedAirport" class="airport-info">
        <div class="airport-details">
          <h2>{{ selectedAirport.name }}</h2>
          <div class="airport-meta">
            <!-- Flughafen Code -->
            <span class="airport-code">{{ selectedAirport.iata || selectedAirport.icao }}</span>
            <!-- Stadt und Land -->
            <span class="airport-location">{{ selectedAirport.city }}, {{ selectedAirport.country }}</span>
          </div>
          <div class="airport-actions">
            <!-- Google Maps Link -->
            <a :href="googleMapsUrl" target="_blank" class="map-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              In Google Maps anzeigen
            </a>
            <!-- Neu laden Button -->
            <button class="refresh-btn" @click="refreshFlights">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Neu laden
            </button>
          </div>
        </div>
      </div>
      
      <!-- Flüge anzeigen -->
      <div class="flights-container">
        <!-- Ladeanimation -->
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Flüge werden geladen</p>
        </div>
        <!-- Fehler anzeigen -->
        <div v-else-if="error" class="error-message">
          <p>{{ error }}</p>
          <button @click="refreshFlights" class="retry-btn">Erneut versuchen</button>
        </div>
        <!-- Flugliste -->
        <FlightList v-else :flights="flights" :airportsData="airportsData" />
      </div>
    </main>
    
    <!-- Fußbereich -->
    <footer class="footer">
      <p>&copy; {{ new Date().getFullYear() }} FlightRadar - Echtzeit Flugchecks</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AirportSearch from './components/AirportSearch.vue'
import FlightList from './components/FlightList.vue'
import { fetchFlightsByDeparture } from './services/api.js'

// App Zustand
const darkMode = ref(true) // Dark Mode aktiv
const flights = ref([]) // Flugdaten Liste
const loading = ref(false) // Ladevorgang aktiv
const error = ref(null) // Fehlermeldung
const selectedAirport = ref(null) // Gewählter Flughafen
const airportsData = ref({}) // Alle Flughäfen

// App starten - Flughäfen laden
onMounted(async () => {
  try {
    const res = await fetch('/airports.json')
    airportsData.value = await res.json()
    console.log('Loaded airport data successfully')
  } catch (err) {
    console.error('Error loading airports data:', err)
    error.value = 'Failed to load airport data'
  }
})

// Google Maps URL erstellen
const googleMapsUrl = computed(() => {
  if (!selectedAirport.value) return '#'
  
  let query = selectedAirport.value.name
  if (selectedAirport.value.city) {
    query += `, ${selectedAirport.value.city}`
  }
  if (selectedAirport.value.country) {
    query += `, ${selectedAirport.value.country}`
  }
  
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
})

// Hell/Dunkel Modus wechseln
function toggleTheme() {
  darkMode.value = !darkMode.value
  document.body.classList.toggle('light-mode', !darkMode.value)
}

// Flüge vom Server holen
async function loadFlights(airportCode) {
  loading.value = true // Ladevorgang starten
  error.value = null // Fehler zurücksetzen
  
  try {
    console.log('Loading flights for:', airportCode)
    
    // Flughafen Info finden
    for (const key in airportsData.value) {
      const airport = airportsData.value[key]
      if (airport.icao === airportCode) {
        selectedAirport.value = airport
        break
      }
    }
    
    // API Aufruf
    const data = await fetchFlightsByDeparture(airportCode)
    console.log('Received flight data:', data)
    flights.value = data
  } catch (err) {
    console.error('Error loading flights:', err)
    error.value = 'Failed to load flight data. Please try again.'
  } finally {
    loading.value = false // Ladevorgang beenden
  }
}

// Flüge neu laden
function refreshFlights() {
  if (selectedAirport.value) {
    loadFlights(selectedAirport.value.icao)
  }
}
</script>

<style scoped>
/* Hauptcontainer */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Kopfbereich */
.header {
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--color-bg-header);
  box-shadow: 0 2px 8px var(--color-shadow);
}

/* Logo Bereich */
.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Flugzeug Icon Farbe */
.airplane-icon {
  color: #3498db;
}

/* Standard Titel */
h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Neon Titel Effekt */
.neon-title {
 font-family: 'Playfair Display', serif;
 font-size: 2.5rem;
 font-weight: 700;
 color: var(--color-text-primary);
 text-shadow: 
   0 0 5px #00ffff,
   0 0 10px #00ffff,
   0 0 20px #00ffff,
   0 0 40px #00ffff;
 animation: neonFlicker 2s ease-in-out infinite alternate;
 margin: 0;
}

/* Neon Flackern Animation */
@keyframes neonFlicker {
 0%, 100% {
   text-shadow: 
     0 0 5px #00ffff,
     0 0 10px #00ffff,
     0 0 20px #00ffff,
     0 0 40px #00ffff;
 }
 50% {
   text-shadow: 
     0 0 2px #00ffff,
     0 0 5px #00ffff,
     0 0 8px #00ffff,
     0 0 12px #00ffff;
 }
}

/* Theme Button */
.theme-toggle button {
  background: none;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  display: flex;
}

/* Theme Button Hover */
.theme-toggle button:hover {
  background-color: var(--color-bg-hover);
}

/* Hauptinhalt */
.main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Such Container */
.search-container {
  margin-bottom: 2rem;
}

/* Such Untertitel */
.search-subtitle {
  color: var(--color-text-secondary);
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}

/* Flughafen Info Box */
.airport-info {
  background-color: var(--color-bg-info);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-left: 4px solid #3498db;
}

/* Flughafen Details */
.airport-details h2 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

/* Flughafen Meta Info */
.airport-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  color: var(--color-text-secondary);
}

/* Flughafen Code hervorheben */
.airport-code {
  font-weight: bold;
  color: #3498db;
}

/* Aktions Buttons */
.airport-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

/* Standard Button Style */
.map-link, .refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

/* Maps Link grün */
.map-link {
  background-color: #2ecc71;
  color: white;
  text-decoration: none;
}

.map-link:hover {
  background-color: #27ae60;
}

/* Refresh Button blau */
.refresh-btn {
  background-color: #3498db;
  color: white;
  border: none;
  cursor: pointer;
}

.refresh-btn:hover {
  background-color: #2980b9;
}

/* Ladeanimation */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

/* Spinner Animation */
.spinner {
  border: 4px solid var(--color-spinner-bg);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

/* Drehen Animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Fehler Box */
.error-message {
  background-color: var(--color-bg-error);
  border-left: 4px solid #e74c3c;
  padding: 1rem;
  border-radius: 0.25rem;
  margin-bottom: 1rem;
}

/* Retry Button rot */
.retry-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

.retry-btn:hover {
  background-color: #c0392b;
}

/* Fußbereich */
.footer {
  background-color: var(--color-bg-header);
  padding: 1.5rem 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* Light Mode Styles */
:global(body.light-mode) {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

:global(body.light-mode) .header {
  background-color: var(--color-bg-header);
  box-shadow: 0 2px 8px var(--color-shadow);
}

:global(body.light-mode) h1 {
  color: var(--color-text-primary);
}

:global(body.light-mode) .theme-toggle button {
  color: var(--color-text-primary);
}

:global(body.light-mode) .footer {
  background-color: var(--color-bg-header);
  border-top: 1px solid var(--color-border);
}

:global(body.light-mode) .airport-info {
  background-color: var(--color-bg-info);
}

:global(body.light-mode) .popup-flight-detail {
  background-color: var(--color-bg-secondary);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }
  
  .main {
    padding: 1rem;
  }
  
  /* Buttons untereinander */
  .airport-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  /* Buttons volle Breite */
  .map-link, .refresh-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>