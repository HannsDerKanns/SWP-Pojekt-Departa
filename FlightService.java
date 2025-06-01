package com.example.AirportDepartures.service;

import com.example.AirportDepartures.model.Flight;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.Console;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class FlightService {

    @Autowired
    private RestTemplate restTemplate;

    public List<Flight> fetchFlightsFromOpenSky(String airportCode) {
        long currentTime = Instant.now().getEpochSecond();

        //Start- und Endzeit der Abfrage
        long begin = currentTime - 86400;
        long end = currentTime;

        //API-Abruf
        String url = String.format("https://opensky-network.org/api/flights/departureairport=%s&b?egin=%d&end=%d",
                airportCode, begin, end);

        //Ausgabe zur Überprüfung
        System.out.println("API URL:"+ url);

        //Speichern der Daten in ein Array
        try {
            Flight[] flights = restTemplate.getForObject(url, Flight[].class);
            return flights != null ? Arrays.asList(flights) : Collections.emptyList();
        } catch (HttpClientErrorException e) {
            System.err.println("Fehler beim Abrufen der Flüge von OpenSky: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            return Collections.emptyList();
        } catch (Exception e) {
            System.err.println("Unbekannter Fehler: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<Flight> getFlightsByDepartureAirport(String airportCode) {
        return fetchFlightsFromOpenSky(airportCode);
    }
}