package com.example.AirportDepartures.model;

import jakarta.persistence.*;

@Entity
@Table(name = "airports")
public class Airport {
    //Eigenschaften
    @Id
    private String code;
    private String name;
    private String city;

    //Getter und Setter
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }
}
