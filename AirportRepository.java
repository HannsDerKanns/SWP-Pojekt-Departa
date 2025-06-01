package com.example.AirportDepartures.repository;

import com.example.AirportDepartures.model.Airport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AirportRepository extends JpaRepository<Airport, String> {
}
