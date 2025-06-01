<template>
  <div class="flight-list">
    <!-- Zeige Meldung wenn keine Flüge da -->
    <div v-if="!flights.length" class="no-flights">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="no-data-icon">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      <p>Keine Flüge für diesen Flughafen im vorgegebenen Zeitraum gefunden</p>
      <p class="no-flights-hint">Versuche, einen anderen Flughafen auszuwählen</p>
    </div>
    
    <!-- Zeige Flüge wenn welche da sind -->
    <div v-else class="flight-section">
      <!-- Header mit Anzahl und Sortier-Buttons -->
      <div class="flight-header">
        <div class="flight-count">{{ flights.length }} Flüge im vorgegebenen Zeitraum gefunden</div>
        <div class="flight-filters">
          <!-- Button: Nach Flugnummer sortieren -->
          <button 
            @click="sortBy('callsign')" 
            :class="['sort-button', { active: sortField === 'callsign' }]"
          >
            Nach Flugnummer sortieren
            <span v-if="sortField === 'callsign'" class="sort-direction">
              {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </span>
          </button>
          <!-- Button: Nach Zeit sortieren -->
          <button 
            @click="sortBy('departureTime')" 
            :class="['sort-button', { active: sortField === 'departureTime' }]"
          >
            Nach Zeit sortieren
            <span v-if="sortField === 'departureTime'" class="sort-direction">
              {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </span>
          </button>
          <!-- Button: Nach Dauer sortieren -->
          <button 
            @click="sortBy('duration')" 
            :class="['sort-button', { active: sortField === 'duration' }]">
            Nach Flugdauer sortieren
            <span v-if="sortField === 'duration'" class="sort-direction">
              {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </span>
          </button>
        </div>
      </div>
      
      <!-- Grid mit allen Flug-Karten -->
      <div class="flights-grid">
        <!-- Eine Karte für jeden Flug -->
        <div v-for="flight in paginatedFlights" :key="flight.icao24" class="flight-card">
          <!-- Oberer Teil: Airline und Status -->
          <div class="flight-top">
            <div class="flight-airline">
              <div class="airline-logo" :style="getAirlineLogoStyle(flight.callsign)">
                {{ getAirlineCode(flight.callsign) }}
              </div>
              <div class="flight-callsign">
                <div class="callsign-main">{{ formatCallsign(flight.callsign) }}</div>
                <div class="callsign-raw">{{ flight.callsign }}</div>
              </div>
            </div>
            <div class="flight-status" :class="getFlightStatusClass(flight)">
              {{ getFlightStatus(flight) }}
            </div>
          </div>
          
          <!-- Mittlerer Teil: Flugstrecke von A nach B -->
          <div class="flight-route">
            <div class="airport-from" style="margin-left: 5%; margin-right: 5%;">
              <div class="airport-code">{{ getAirportCode(flight.estDepartureAirport) }}</div>
              <div class="airport-name">{{ getAirportName(flight.estDepartureAirport) }}</div>
            </div>
            
            <!-- Pfeil zwischen Flughäfen -->
            <div class="flight-path">
              <div class="flight-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
            
            <div class="airport-to" style="margin-left: 5%; margin-right: 5%;">
              <div class="airport-code">{{ getAirportCode(flight.estArrivalAirport) }}</div>
              <div class="airport-name">{{ getAirportName(flight.estArrivalAirport) }}</div>
            </div>
          </div>
          
          <!-- Flugzeug-Details: Zeit, Dauer etc. -->
          <div class="flight-details">
            <div class="flight-detail">
              <div class="detail-label">Flugzeug</div>
              <div class="detail-value">{{ flight.icao24 || 'Unbekannt' }}</div>
            </div>
            
            <div class="flight-detail">
              <div class="detail-label">Abflug</div>
              <div class="detail-value">{{ formatTime(flight.firstSeen) }}</div>
            </div>
            
            <div class="flight-detail">
              <div class="detail-label">Ankunf</div>
              <div class="detail-value">{{ formatTime(flight.lastSeen) }}</div>
            </div>
            
            <div class="flight-detail">
              <div class="detail-label">Dauer</div>
              <div class="detail-value">{{ calculateDuration(flight.firstSeen, flight.lastSeen) }}</div>
            </div>
          </div>
          
          <!-- Buttons: Details und Karte -->
          <div class="flight-actions">
            <button @click="openFlightDetails(flight)" class="action-button track-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Flugdetails anzeigen
            </button>
          </div>
        </div>
      </div>
      
      <!-- Seitenwechsel: Vor/Zurück Buttons -->
      <div class="pagination">
        <button @click="prevPage" :disabled="page === 1" class="pagination-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Vorherige Seite
        </button>
        
        <div class="pagination-info">
          Seite {{ page }} / {{ totalPages }}
        </div>
        
        <button @click="nextPage" :disabled="page >= totalPages" class="pagination-button">
          Nächste Seite
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      
      <!-- Popup-Fenster für Flugdetails -->
      <div v-if="selectedFlight" class="flight-popup-overlay" @click="closeFlightDetails">
        <div class="flight-popup" @click.stop>
          <!-- Popup Header mit Airline und X-Button -->
          <div class="flight-popup-header">
            <div class="flight-popup-airline">
              <div class="airline-logo" :style="getAirlineLogoStyle(selectedFlight.callsign)">
                {{ getAirlineCode(selectedFlight.callsign) }}
              </div>
              <div class="flight-popup-title">
                <h2>{{ formatCallsign(selectedFlight.callsign) }}</h2>
                <div class="callsign-raw">{{ selectedFlight.callsign }}</div>
              </div>
            </div>
            <button class="flight-popup-close" @click="closeFlightDetails">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <!-- Popup Inhalt: Karte und Details -->
          <div class="flight-popup-content">
            <!-- Große Karte mit Flugstrecke -->
            <div class="flight-map-container">
              <div id="flight-map" ref="flightMap"></div>
            </div>
            
            <!-- Details unter der Karte -->
            <div class="flight-popup-details">
              <div style="text-align: center; color: lightgray; font-size: 0.7em">Flug: {{ selectedFlight.icao24 || 'Unbekannt' }}</div>
              <div class="flight-popup-route">
                <div class="popup-airport-from">
                  <div class="airport-code">{{ getAirportCode(selectedFlight.estDepartureAirport) }}</div>
                  <div class="airport-name">{{ getAirportName(selectedFlight.estDepartureAirport) }}</div>
                </div>
                
                <div class="popup-flight-path">
                  <div class="flight-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="M12 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
                
                <div class="popup-airport-to">
                  <div class="airport-code">{{ getAirportCode(selectedFlight.estArrivalAirport) }}</div>
                  <div class="airport-name">{{ getAirportName(selectedFlight.estArrivalAirport) }}</div>
                </div>
              </div>
              
              <div class="popup-flight-details" style="text-align: center;">
                <div class="popup-flight-detail">
                  <div class="detail-label">Status</div>
                  <div class="detail-value status" :class="getFlightStatusClass(selectedFlight)">
                    {{ getFlightStatus(selectedFlight) }}
                  </div>
                </div>
                
                <div class="popup-flight-detail">
                  <div class="detail-label">Abflug</div>
                  <div class="detail-value">{{ formatTime(selectedFlight.firstSeen) }}</div>
                </div>
                
                <div class="popup-flight-detail">
                  <div class="detail-label">Ankunft</div>
                  <div class="detail-value">{{ formatTime(selectedFlight.lastSeen) }}</div>
                </div>
                
                <div class="popup-flight-detail">
                  <div class="detail-label">Dauer</div>
                  <div class="detail-value">{{ calculateDuration(selectedFlight.firstSeen, selectedFlight.lastSeen) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

// Props von Parent Component
const props = defineProps({
  flights: {
    type: Array,
    default: () => []
  },
  airportsData: {
    type: Object,
    default: () => ({})
  }
});

// Reaktive Variablen für Zustand
const page = ref(1); // Aktuelle Seite
const itemsPerPage = ref(10); // Flüge pro Seite
const sortField = ref('callsign'); // Sortier-Feld
const sortDirection = ref('asc'); // Sortier-Richtung
const selectedFlight = ref(null); // Ausgewählter Flug für Popup
const flightMap = ref(null); // Map Element Referenz
let map = null; // Leaflet Karte

// Zurück zu Seite 1 wenn neue Flüge kommen
watch(() => props.flights, () => {
  page.value = 1;
});

// Sortierte Flüge berechnen
const sortedFlights = computed(() => {
  if (!props.flights || props.flights.length === 0) return [];

  return [...props.flights].sort((a, b) => {
    let valueA, valueB;

    // Je nach Sortier-Feld verschiedene Werte
    if (sortField.value === 'callsign') {
      valueA = (a.callsign || '').toLowerCase();
      valueB = (b.callsign || '').toLowerCase();
    } else if (sortField.value === 'departureTime') {
      valueA = a.firstSeen || 0;
      valueB = b.firstSeen || 0;
    } else if (sortField.value === 'duration') {
      valueA = (a.lastSeen || 0) - (a.firstSeen || 0);
      valueB = (b.lastSeen || 0) - (b.firstSeen || 0);
    } else {
      valueA = a[sortField.value];
      valueB = b[sortField.value];
    }

    // Aufsteigend oder absteigend sortieren
    if (sortDirection.value === 'asc') {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  });
});

// Gesamte Seitenanzahl berechnen
const totalPages = computed(() => {
  return Math.ceil(sortedFlights.value.length / itemsPerPage.value);
});

// Flüge für aktuelle Seite
const paginatedFlights = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  return sortedFlights.value.slice(start, start + itemsPerPage.value);
});

// Zur nächsten Seite
function nextPage() {
  if (page.value < totalPages.value) page.value++;
}

// Zur vorherigen Seite
function prevPage() {
  if (page.value > 1) page.value--;
}

// Sortierung ändern
function sortBy(field) {
  if (sortField.value === field) {
    // Richtung umkehren bei gleichem Feld
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // Neues Feld mit aufsteigend
    sortField.value = field;
    sortDirection.value = 'asc';
  }
}

// Flughafen Code holen (IATA bevorzugt)
function getAirportCode(icao) {
  if (!icao) return 'N/A';
  
  // IATA Code ist kürzer und bekannter
  const airport = props.airportsData[icao];
  if (airport && airport.iata) {
    return airport.iata;
  }
  return icao;
}

// Flughafen Name holen
function getAirportName(icao) {
  if (!icao) return 'Unbekannt';
  
  const airport = props.airportsData[icao];
  if (airport && airport.name) {
    return airport.name;
  }
  
  return `Airport ${icao}`;
}

// Airline Code aus Callsign
function getAirlineCode(callsign) {
  if (!callsign) return '';
  
  // Erste 3 Buchstaben = Airline
  return callsign.substring(0, 3);
}

// Callsign schön formatieren
function formatCallsign(callsign) {
  if (!callsign) return 'Unbekannt';
  
  // Airline Code + Leerzeichen + Nummer
  const match = callsign.match(/^([A-Z]{2,3})(\d+.*)$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return callsign;
}

// Zeitstempel zu Uhrzeit
function formatTime(timestamp) {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Flugdauer berechnen
function calculateDuration(start, end) {
  if (!start || !end) return 'N/A';
  
  const durationMinutes = Math.floor((end - start) / 60);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Flugstatus bestimmen
function getFlightStatus(flight) {
  // Einfache Logik für Demo
  if (!flight.firstSeen) return 'Scheduled';
  if (!flight.lastSeen) return 'In Air';
  return 'Gelandet';
}

// CSS Klasse für Status
function getFlightStatusClass(flight) {
  const status = getFlightStatus(flight);
  if (status === 'Scheduled') return 'status-scheduled';
  if (status === 'In Air') return 'status-active';
  return 'status-completed';
}

// Airline Logo Farbe generieren
function getAirlineLogoStyle(callsign) {
  if (!callsign) return {};
  
  // Konsistente Farbe für Airline
  const airlineCode = getAirlineCode(callsign);
  const hue = hashStringToNumber(airlineCode) % 360;
  
  return {
    backgroundColor: `hsl(${hue}, 70%, 45%)`,
  };
}

// String zu Zahl für Farbe
function hashStringToNumber(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // In 32bit Integer umwandeln
  }
  return Math.abs(hash);
}

// Google Maps URL für Flughafen
function getAirportMapUrl(icao) {
  if (!icao) return '#';
  
  const airport = props.airportsData[icao];
  let query = icao;
  
  if (airport) {
    query = airport.name;
    if (airport.city) {
      query += `, ${airport.city}`;
    }
    if (airport.country) {
      query += `, ${airport.country}`;
    }
  }
  
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
}

// Flugdetails Popup öffnen
function openFlightDetails(flight) {
  selectedFlight.value = flight;
  document.body.style.overflow = 'hidden'; // Scrollen verhindern
  
  // Karte nach DOM Update initialisieren
  setTimeout(() => {
    initializeMap(flight);
  }, 100);
}

// Flugdetails Popup schließen
function closeFlightDetails() {
  selectedFlight.value = null;
  document.body.style.overflow = ''; // Scrollen wieder erlauben
  
  // Karte aufräumen
  if (map) {
    map.remove();
    map = null;
  }
}

// Flughafen Koordinaten holen
function getAirportCoordinates(icao) {
  const airport = props.airportsData[icao];
  
  if (airport && airport.lat && airport.lon) {
    return [airport.lat, airport.lon];
  }
  
  // Fallback für Demo - in Produktion entfernen
  return [
    40 + (Math.random() * 20 - 10),
    -10 + (Math.random() * 60)
  ];
}

// Leaflet Karte initialisieren
function initializeMap(flight) {
  // Alte Karte entfernen
  if (map) {
    map.remove();
    map = null;
  }
  
  if (!flightMap.value) return;
  
  // Leaflet laden falls nicht vorhanden
  if (typeof L === 'undefined') {
    // CSS für Leaflet laden
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(linkElement);
    
    // JavaScript für Leaflet laden
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
    scriptElement.onload = () => {
      createMap(flight);
    };
    document.head.appendChild(scriptElement);
  } else {
    createMap(flight);
  }
}

// Karte erstellen mit Flugstrecke
function createMap(flight) {
  const departureCoords = getAirportCoordinates(flight.estDepartureAirport);
  const arrivalCoords = getAirportCoordinates(flight.estArrivalAirport);
  
  // Karte in der Mitte der Strecke
  map = L.map(flightMap.value).setView([
    (departureCoords[0] + arrivalCoords[0]) / 2,
    (departureCoords[1] + arrivalCoords[1]) / 2
  ], 4);
  
  // Karten-Tiles (Hintergrund) laden
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);
  
  // Abflug-Marker hinzufügen
  const departureMarker = L.circleMarker(departureCoords, {
    radius: 7,
    fillColor: '#3498db',
    color: '#ffffff',
    weight: 2,
    opacity: 1,
    fillOpacity: 1
  }).addTo(map);
  
  departureMarker.bindTooltip(getAirportName(flight.estDepartureAirport), {
    permanent: false,
    direction: 'top'
  });
  
  // Ankunft-Marker hinzufügen
  const arrivalMarker = L.circleMarker(arrivalCoords, {
    radius: 7,
    fillColor: '#3498db',
    color: '#ffffff',
    weight: 2,
    opacity: 1,
    fillOpacity: 1
  }).addTo(map);
  
  arrivalMarker.bindTooltip(getAirportName(flight.estArrivalAirport), {
    permanent: false,
    direction: 'top'
  });
  
  // Flugstrecke als Linie
  const flightPath = L.polyline([departureCoords, arrivalCoords], {
    color: '#3498db',
    weight: 2,
    opacity: 1,
    dashArray: '5, 5'
  }).addTo(map);
  
  // Pfeil für Flugrichtung
  const arrowHead = L.polylineDecorator(flightPath, {
    patterns: [
      {
        offset: '50%', 
        repeat: 0, 
        symbol: L.Symbol.arrowHead({
          pixelSize: 15,
          polygon: false,
          pathOptions: {
            color: '#3498db',
            fillOpacity: 1,
            weight: 2
          }
        })
      }
    ]
  }).addTo(map);
  
  // Karte so zoomen dass alles sichtbar
  const bounds = L.latLngBounds(departureCoords, arrivalCoords);
  map.fitBounds(bounds, {
    padding: [50, 50]
  });
}

// Leaflet Plugins laden
onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.L !== 'undefined' && typeof window.L.polylineDecorator === 'undefined') {
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet-polylinedecorator/1.6.0/leaflet.polylineDecorator.min.js';
    document.head.appendChild(scriptElement);
  }
});
</script>

<style scoped>
  .flight-list {
    width: 100%;
  }

  .no-flights {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    background-color: var(--color-bg-secondary);
    border-radius: 0.5rem;
    border: 1px dashed var(--color-border);
  }

  .no-data-icon {
    color: var(--color-text-secondary);
    margin-bottom: 1rem;
  }

  .no-flights p {
    margin: 0.5rem 0;
    font-size: 1.125rem;
  }

  .no-flights-hint {
    color: var(--color-text-secondary);
    font-size: 0.875rem !important;
  }

  .flight-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .flight-count {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .flight-filters {
    display: flex;
    gap: 0.5rem;
  }

  .sort-button {
    background: none;
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .sort-button:hover {
    border-color: var(--color-border-light);
    color: var(--color-text-primary);
  }

  .sort-button.active {
    border-color: #3498db;
    color: #3498db;
  }

  .flights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(425px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .flight-card {
    background-color: var(--color-bg-card);
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
  }

  .flight-top {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border);
  }

  .flight-airline {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .airline-logo {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
    font-size: 0.875rem;
  }

  .flight-callsign {
    display: flex;
    flex-direction: column;
  }

  .callsign-main {
    font-weight: 600;
    font-size: 1rem;
  }

  .callsign-raw {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .flight-status {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
  }

  .status-scheduled {
    background-color: rgba(255, 193, 7, 0.2);
    color: #ffc107;
  }

  .status-active {
    background-color: rgba(46, 204, 113, 0.2);
    color: #2ecc71;
  }

  .status-completed {
    background-color: rgba(52, 152, 219, 0.2);
    color: #3498db;
  }

  .flight-route {
    padding: 1rem;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .airport-from, .airport-to {
    text-align: center;
  }

  .airport-code {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  .airport-name {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .flight-path {
    height: 2px;
    background-color: #3498db;
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flight-arrow {
    position: absolute;
    color: #3498db;
  }

  .flight-details {
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem 0.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .flight-detail {
    display: flex;
    flex-direction: column;
  }

  .detail-label {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.25rem;
  }

  .detail-value {
    font-size: 0.875rem;
  }

  .flight-actions {
    padding: 1rem;
    display: flex;
    gap: 0.75rem;
  }

  .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    text-decoration: none;
    flex: 1;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .track-button {
    background-color: #3498db;
    color: white;
  }

  .track-button:hover {
    background-color: #2980b9;
  }

  .map-button {
    background-color: #2ecc71;
    color: white;
  }

  .map-button:hover {
    background-color: #27ae60;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
  }

  .pagination-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--color-bg-tertiary);
    border: none;
    color: var(--color-text-primary);
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .pagination-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination-button:not(:disabled):hover {
    background-color: #3498db;
  }

  .pagination-info {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  /* Flight Popup Styles */
  .flight-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .flight-popup {
    background-color: var(--color-bg-card);
    border-radius: 0.5rem;
    width: 80%;
    height: 90%;
    max-width: 1200px;
    max-height: 800px;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
  }

  .flight-popup-header {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border);
  }

  .flight-popup-airline {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .flight-popup-title {
    display: flex;
    flex-direction: column;
  }

  .flight-popup-title h2 {
    margin: 0;
    font-size: 1.25rem;
  }

  .flight-popup-close {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flight-popup-close:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary);
  }

  .flight-popup-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .flight-map-container {
    position: relative;
    height: 66%;
    width: 100%;
    background-color: #f5f5f5;
  }

  #flight-map {
    width: 100%;
    height: 100%;
  }

  .flight-route-legend {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background-color: white;
    border-radius: 4px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .route-airport {
    display: flex;
    align-items: center;
    gap: 5px;
    font-weight: 500;
  }

  .airport-marker {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
  }

  .departure, .arrival {
    background-color: #3498db;
  }

  .route-line {
    width: 40px;
    height: 20px;
    display: flex;
    align-items: center;
  }

  .flight-popup-details {
    height: 34%;
    padding: 1rem;
    overflow-y: auto;
    border-top: 1px solid var(--color-border);
  }

  .flight-popup-route {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .popup-airport-from, .popup-airport-to {
    text-align: center;
  }

  .popup-flight-path {
    height: 2px;
    background-color: #3498db;
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .popup-flight-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .popup-flight-detail {
    padding: 0.75rem;
    background-color: var(--color-bg-tertiary);
    border-radius: 0.5rem;
  }

  .detail-value.status {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.875rem;
  }

  /* Light mode styles */
  :global(body.light-mode) .flight-card {
    background-color: var(--color-bg-card);
    border-color: var(--color-border);
    box-shadow: var(--shadow-sm);
  }

  :global(body.light-mode) .flight-top,
  :global(body.light-mode) .flight-route,
  :global(body.light-mode) .flight-details {
    border-bottom-color: var(--color-border);
  }

  :global(body.light-mode) .no-flights {
    background-color: var(--color-bg-secondary);
    border-color: var(--color-border-light);
  }

  :global(body.light-mode) .sort-button {
    border-color: var(--color-border-light);
    color: var(--color-text-secondary);
  }

  :global(body.light-mode) .pagination-button {
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  :global(body.light-mode) .flight-popup {
    background-color: var(--color-bg-card);
    box-shadow: var(--shadow-lg);
  }

  :global(body.light-mode) .flight-popup-header,
  :global(body.light-mode) .flight-popup-details {
    border-color: var(--color-border);
  }

  :global(body.light-mode) .popup-flight-detail {
    background-color: var(--color-bg-tertiary);
  }

  @media (max-width: 768px) {
    .flights-grid {
      grid-template-columns: 1fr;
    }
    
    .flight-header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .flight-details {
      grid-template-columns: 1fr;
    }
    
    .flight-popup {
      width: 95%;
      height: 95%;
    }
    
    .popup-flight-details {
      grid-template-columns: 1fr;
    }
  }
</style>