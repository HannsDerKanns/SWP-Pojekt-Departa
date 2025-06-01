package com.example.AirportDepartures.model;

import jakarta.persistence.*;

@Entity
@Table(name = "flights")
public class Flight {
    //Eigenschaften
    @Id
    private String icao24;
    private String callsign;
    private String estDepartureAirport;
    private String estArrivalAirport;
    private int lastSeen;
    private int firstSeen;

    //Getter und Setter
    public String getIcao24() {
        return icao24;
    }

    public void setIcao24(String icao24) {
        this.icao24 = icao24;
    }

    public String getCallsign() {
        return callsign;
    }

    public void setCallsign(String callsign) {
        this.callsign = callsign;
    }

    public String getEstDepartureAirport() {
        return estDepartureAirport;
    }

    public void setEstDepartureAirport(String estDepartureAirport) {
        this.estDepartureAirport = estDepartureAirport;
    }

    public String getEstArrivalAirport() {
        return estArrivalAirport;
    }

    public void setEstArrivalAirport(String estArrivalAirport) {
        this.estArrivalAirport = estArrivalAirport;
    }

    public int getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(int lastSeen) {
        this.lastSeen = lastSeen;
    }

    public int getFirstSeen() {
        return firstSeen;
    }

    public void setFirstSeen(int firstSeen) {
        this.firstSeen = firstSeen;
    }
}
