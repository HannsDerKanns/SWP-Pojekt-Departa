// src/services/api.js

const API_BASE = 'http://localhost:8080/api';

/**
 * Holt Flüge die von einem bestimmten Flughafen abfliegen
 * @param {string} airportCode - ICAO Code des Abflugflughafens
 * @returns {Promise<Array>} - Promise das ein Array von Flugobjekten zurückgibt
 */
export async function fetchFlightsByDeparture(airportCode) {
  try {
    console.log(`Lade Flüge für Flughafen: ${airportCode}`);
    const res = await fetch(`${API_BASE}/flights/departure?airportCode=${encodeURIComponent(airportCode)}`);
    
    if (!res.ok) {
      throw new Error(`API Fehler: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Fehler beim Laden der Flüge:', error);
    throw error;
  }
}

/**
 * Sucht nach Flughäfen die einer Suchanfrage entsprechen
 * @param {string} query - Suchanfrage (Name, Code, Stadt)
 * @returns {Promise<Array>} - Promise das ein Array von Flughafen-Vorschlägen zurückgibt
 */
export async function fetchAirportSuggestions(query) {
  try {
    // Lädt die komplette airports.json Datei
    const res = await fetch('/airports.json');
    if (!res.ok) {
      throw new Error(`Fehler beim Laden der Flughafendaten: ${res.status}`);
    }
    
    const data = await res.json();
    const results = [];
    const lowerQuery = query.toLowerCase();
  
    // Durchsucht alle Flughäfen nach Übereinstimmungen
    for (const key in data) {
      const airport = data[key];
      
      // Prüft ob der Flughafen die nötigen Felder hat und der Suchanfrage entspricht
      if (airport && (
          (airport.name && airport.name.toLowerCase().includes(lowerQuery)) ||
          (airport.iata && airport.iata.toLowerCase().includes(lowerQuery)) ||
          (airport.icao && airport.icao.toLowerCase().includes(lowerQuery)) ||
          (airport.city && airport.city.toLowerCase().includes(lowerQuery)) ||
          (airport.country && airport.country.toLowerCase().includes(lowerQuery))
        )
      ) {
        // Fügt zu Ergebnissen mit allen nötigen Informationen hinzu
        results.push({
          code: airport.icao,
          iata: airport.iata,
          name: airport.name || 'Unbekannter Flughafen',
          city: airport.city || 'Unbekannter Ort',
          state: airport.state || '',
          country: airport.country || '',
          lat: airport.lat,
          lon: airport.lon,
          elevation: airport.elevation,
          timezone: airport.tz
        });
      }
    }
    
    // Sortiert Ergebnisse nach Relevanz - priorisiert exakte Code-Treffer, dann Namen-Treffer
    results.sort((a, b) => {
      // Exakte ICAO oder IATA Treffer kommen zuerst
      if ((a.code && a.code.toLowerCase() === lowerQuery) || 
          (a.iata && a.iata.toLowerCase() === lowerQuery)) return -1;
      if ((b.code && b.code.toLowerCase() === lowerQuery) || 
          (b.iata && b.iata.toLowerCase() === lowerQuery)) return 1;
      
      // Dann werden Treffer im Namen priorisiert
      const aNameMatch = a.name.toLowerCase().includes(lowerQuery);
      const bNameMatch = b.name.toLowerCase().includes(lowerQuery);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // Dann werden Treffer in der Stadt priorisiert
      const aCityMatch = a.city.toLowerCase().includes(lowerQuery);
      const bCityMatch = b.city.toLowerCase().includes(lowerQuery);
      if (aCityMatch && !bCityMatch) return -1;
      if (!aCityMatch && bCityMatch) return 1;
      
      // Alphabetisch nach Namen als finaler Tie-Breaker
      return a.name.localeCompare(b.name);
    });
    
    // Begrenzt Ergebnisse zur Performance-Verbesserung
    return results.slice(0, 10);
  } catch (error) {
    console.error('Fehler bei der Flughafensuche:', error);
    return [];
  }
}

/**
 * Holt detaillierte Informationen über einen bestimmten Flughafen
 * @param {string} icao - ICAO Code des Flughafens
 * @returns {Promise<Object>} - Promise das Flughafen-Informationen zurückgibt
 */
export async function fetchAirportDetails(icao) {
  try {
    const res = await fetch('/airports.json');
    const airports = await res.json();
    
    return airports[icao] || null;
  } catch (error) {
    console.error('Fehler beim Laden der Flughafendetails:', error);
    return null;
  }
}

/**
 * Holt eine Wettervorhersage für einen Flughafenstandort
 * Das ist eine Platzhalter-Funktion - in einer echten Anwendung würdest du
 * dich mit einer Wetter-API verbinden und die Koordinaten des Flughafens nutzen
 * 
 * @param {Object} airport - Flughafen-Objekt mit lat/lon Koordinaten
 * @returns {Promise<Object>} - Promise das Wetterdaten zurückgibt
 */
export async function fetchAirportWeather(airport) {
  // Das ist eine Mock-Implementierung
  if (!airport || !airport.lat || !airport.lon) {
    throw new Error('Ungültige Flughafendaten');
  }
  
  // In einer echten App würdest du hier eine Wetter-API aufrufen
  console.log(`Würde Wetter laden für: ${airport.name} bei ${airport.lat},${airport.lon}`);
  
  // Gibt Mock-Daten zur Demonstration zurück
  return {
    temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
    conditions: ['Sonnig', 'Bewölkt', 'Regnerisch', 'Schnee'][Math.floor(Math.random() * 4)],
    windSpeed: Math.floor(Math.random() * 30), // 0-30 km/h
    humidity: Math.floor(Math.random() * 60) + 40 // 40-100%
  };
}