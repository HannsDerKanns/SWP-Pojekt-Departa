<template>
  <div class="airport-search">
    <!-- Suchfeld Container mit Icon und Input -->
    <div class="search-input-container">
      <!-- Lupe Icon links -->
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      
      <!-- Hauptsuchfeld -->
      <input
        v-model="search"
        @input="onSearch"                                 <!-- Suche bei jedem Buchstaben -->
        @focus="showDropdown = true"                      <!-- Dropdown öffnen bei Klick -->
        @blur="hideDropdownDelayed"                       <!-- Dropdown schließen nach Verzögerung -->
        @keydown.down.prevent="navigateSuggestion(1)"     <!-- Pfeil runter -->
        @keydown.up.prevent="navigateSuggestion(-1)"      <!-- Pfeil hoch -->
        @keydown.enter.prevent="selectHighlightedSuggestion" <!-- Enter = Auswählen -->
        @keydown.esc="hideDropdown"                       <!-- Escape = Schließen -->
        placeholder="Hier Suchbegriff eingeben"
        class="search-input"
      />
      
      <!-- X-Button zum Löschen (nur wenn Text da ist) -->
      <button v-if="search" @click="clearSearch" class="clear-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <!-- Dropdown mit Flughafen-Vorschlägen -->
    <div v-if="showDropdown && suggestions.length" class="suggestions-dropdown">
      <ul class="suggestions-list">
        <li
          v-for="(suggestion, index) in suggestions"
          :key="suggestion.code"
          :class="['suggestion-item', { 'highlighted': index === highlightedIndex }]"
          @mousedown.prevent="selectAirport(suggestion)"   <!-- Flughafen auswählen -->
          @mouseover="highlightedIndex = index"            <!-- Hover = Highlight -->
        >
          <!-- Flughafen Code (z.B. VIE) -->
          <div class="suggestion-code">
            <span class="code-label">{{ suggestion.code }}</span>
            <span class="code-secondary" v-if="suggestion.iata">({{ suggestion.iata }})</span>
          </div>
          
          <!-- Flughafen Details -->
          <div class="suggestion-details">
            <div class="suggestion-name">{{ suggestion.name }}</div>
            <div class="suggestion-location">{{ suggestion.city }}{{ suggestion.state ? ', ' + suggestion.state : '' }}, {{ suggestion.country }}</div>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- Keine Ergebnisse Meldung -->
    <div v-if="showDropdown && search.length > 1 && !suggestions.length" class="no-results">
      Keine Flughäfen gefunden "{{ search }}"
    </div>
    
    <!-- Hinweis: Mindestens 2 Zeichen -->
    <div v-if="showDropdown && search.length <= 1 && !isLoading" class="search-hint">
      Mind. 2 Zeichen eingeben
    </div>
    
    <!-- Loading Spinner -->
    <div v-if="isLoading" class="loading-indicator">
      <div class="loading-spinner"></div>
      <span>Searching...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, onMounted, onBeforeUnmount } from 'vue';
import { fetchAirportSuggestions } from '../services/api.js';

// Event für Parent Component
const emit = defineEmits(['airportSelected']);

// Reactive Variablen
const search = ref('');                    // Suchtext
const suggestions = ref([]);               // Flughafen Liste
const showDropdown = ref(false);           // Dropdown sichtbar?
const highlightedIndex = ref(-1);          // Welcher Eintrag ist markiert
const isLoading = ref(false);              // Lädt gerade?

// Timeouts für Debouncing
let searchTimeout = null;                  // Wartezeit vor Suche
let blurTimeout = null;                    // Wartezeit vor Schließen

// Component mounted - Event Listener hinzufügen
onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

// Component unmounted - Cleanup
onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
  if (searchTimeout) clearTimeout(searchTimeout);
  if (blurTimeout) clearTimeout(blurTimeout);
});

// Klick außerhalb schließt Dropdown
function handleOutsideClick(event) {
  const searchElement = document.querySelector('.airport-search');
  if (searchElement && !searchElement.contains(event.target)) {
    hideDropdown();
  }
}

// Suche starten (mit Debouncing)
function onSearch() {
  // Alte Suche abbrechen
  if (searchTimeout) clearTimeout(searchTimeout);
  
  highlightedIndex.value = -1;
  
  // Zu wenig Zeichen? Nichts machen
  if (search.value.length <= 1) {
    suggestions.value = [];
    isLoading.value = false;
    return;
  }
  
  isLoading.value = true;
  
  // 300ms warten dann suchen (Debouncing)
  searchTimeout = setTimeout(async () => {
    try {
      const data = await fetchAirportSuggestions(search.value);
      suggestions.value = data;
      showDropdown.value = true;
    } catch (error) {
      console.error('Error fetching airport suggestions:', error);
    } finally {
      isLoading.value = false;
    }
  }, 300);
}

// Suchfeld komplett leeren
function clearSearch() {
  search.value = '';
  suggestions.value = [];
  showDropdown.value = false;
}

// Flughafen auswählen und Event senden
function selectAirport(suggestion) {
  console.log('Selected airport:', suggestion);
  search.value = `${suggestion.name} (${suggestion.code})`;
  suggestions.value = [];
  showDropdown.value = false;
  highlightedIndex.value = -1;
  emit('airportSelected', suggestion.code);
}

// Dropdown sofort schließen
function hideDropdown() {
  showDropdown.value = false;
}

// Dropdown nach kurzer Verzögerung schließen
function hideDropdownDelayed() {
  // Timeout damit Click Events noch funktionieren
  blurTimeout = setTimeout(() => {
    hideDropdown();
  }, 200);
}

// Pfeiltasten Navigation durch Liste
function navigateSuggestion(direction) {
  if (!suggestions.value.length) return;
  
  const newIndex = highlightedIndex.value + direction;
  
  // Am Ende? Zum Anfang springen
  if (newIndex >= suggestions.value.length) {
    highlightedIndex.value = 0;
  } 
  // Am Anfang? Zum Ende springen
  else if (newIndex < 0) {
    highlightedIndex.value = suggestions.value.length - 1;
  } 
  else {
    highlightedIndex.value = newIndex;
  }
  
  // Markierten Eintrag sichtbar scrollen
  const listItems = document.querySelectorAll('.suggestion-item');
  if (listItems[highlightedIndex.value]) {
    listItems[highlightedIndex.value].scrollIntoView({ block: 'nearest' });
  }
}

// Enter-Taste: Markierten Eintrag auswählen
function selectHighlightedSuggestion() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.value.length) {
    selectAirport(suggestions.value[highlightedIndex.value]);
  }
}
</script>

<style scoped>
/* Haupt Container */
.airport-search {
  position: relative;
  width: 100%;
}

/* Suchfeld Container */
.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* Lupe Icon */
.search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-secondary);
}

/* Hauptsuchfeld */
.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem;
  font-size: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-input);
  color: var(--color-text-primary);
  transition: all 0.2s;
}

/* Focus Effekt */
.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

/* X-Button zum Löschen */
.clear-button {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.clear-button:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

/* Dropdown Container */
.suggestions-dropdown {
  position: absolute;
  width: 100%;
  margin-top: 0.5rem;
  background-color: var(--color-bg-card);
  border-radius: 0.5rem;
  box-shadow: var(--color-shadow-dropdown);
  z-index: 10;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
}

/* Liste ohne Bulletpoints */
.suggestions-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

/* Einzelner Vorschlag */
.suggestion-item {
  display: flex;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-light);
}

.suggestion-item:last-child {
  border-bottom: none;
}

/* Hover und Highlight Effekt */
.suggestion-item:hover, .suggestion-item.highlighted {
  background-color: var(--color-bg-suggestion-hover);
}

/* Flughafen Code (VIE, etc.) */
.suggestion-code {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  min-width: 60px;
}

.code-label {
  font-weight: bold;
  font-size: 1rem;
}

.code-secondary {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}

/* Flughafen Details */
.suggestion-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.suggestion-name {
  font-weight: 500;
}

.suggestion-location {
  font-size: 0.875rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}

/* Keine Ergebnisse */
.no-results {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-secondary);
}

/* Suchhinweis */
.search-hint {
  padding: 0.75rem;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* Loading Anzeige */
.loading-indicator {
  position: absolute;
  right: 10px;
  top: 9px;
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

/* Spinning Animation */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(52, 152, 219, 0.3);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 0.8s linear infinite;
  margin-right: 4px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Light Mode Styles */
:global(body.light-mode) .search-input {
  background-color: var(--color-bg-input);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

:global(body.light-mode) .suggestions-dropdown {
  background-color: var(--color-bg-card);
  border-color: var(--color-border);
  box-shadow: var(--color-shadow-dropdown);
}

:global(body.light-mode) .suggestion-item {
  border-bottom-color: var(--color-border-light);
}

:global(body.light-mode) .suggestion-item:hover, 
:global(body.light-mode) .suggestion-item.highlighted {
  background-color: var(--color-bg-suggestion-hover);
  color: var(--color-text-primary);
}
</style>