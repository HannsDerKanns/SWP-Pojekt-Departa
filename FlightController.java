package com.example.AirportDepartures.controller;

import com.example.AirportDepartures.model.Flight;
import com.example.AirportDepartures.service.FlightService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
public class FlightController {

    @Autowired
    private FlightService flightService;

    //Flüge eines Flughafens - nach Abflug
    @GetMapping("/departure")
    public List<Flight> getFlightsByDeparture(@RequestParam String airportCode) {
        return flightService.getFlightsByDepartureAirport(airportCode);
    }

    //Flüge eines Flughafen - nach Ankunft
    @GetMapping("/arrival")
    public List<Flight> getFlightsByArrival(@RequestParam String airportCode) {
        return flightService.getFlightsByDepartureAirport(airportCode);
    }

}
