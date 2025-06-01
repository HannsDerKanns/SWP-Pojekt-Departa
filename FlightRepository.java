package com.example.AirportDepartures.repository;

import com.example.AirportDepartures.model.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FlightRepository extends JpaRepository<Flight, Long> {
    List<Flight> findByEstDepartureAirport(String airportCode);
}
