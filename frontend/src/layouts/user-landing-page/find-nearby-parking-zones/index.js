import React, { useState, useEffect, useRef } from "react";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import Icon from "@mui/material/Icon";
import bgImage from "assets/images/parking-cover.jpg";
import UserLayout from "layouts/user-landing-page/components/UserLayout";

const Maps_API_KEY = "AIzaSyC2pYFZSJPyqUlguy8yPNXJfbZNu7kNCnQ";

const FindNearbyParkingZones = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyZones, setNearbyZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (userLocation && window.google) {
      initMap();
    }
  }, [userLocation]);

  const loadGoogleMapsScript = (callback) => {
    if (window.google) {
      callback();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${Maps_API_KEY}&libraries=places`;
    script.onload = callback;
    script.onerror = () => setError("Failed to load Google Maps script.");
    document.head.appendChild(script);
  };

  const initMap = () => {
    const map = new window.google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 15,
    });

    new window.google.maps.Marker({
      position: userLocation,
      map: map,
      title: "Your Location",
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      },
    });

    const service = new window.google.maps.places.PlacesService(map);
    service.nearbySearch(
      {
        location: userLocation,
        radius: 1000,
        type: ["parking"],
      },
      (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setNearbyZones(results);
          for (let i = 0; i < results.length; i++) {
            createMarker(results[i], map);
          }
        } else {
          setNearbyZones([]);
        }
        setLoading(false);
      }
    );
  };

  const createMarker = (place, map) => {
    new window.google.maps.Marker({
      map: map,
      position: place.geometry.location,
      title: place.name,
    });
  };

  const handleFindNearby = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          loadGoogleMapsScript(() => {
            // Script loaded, useEffect will handle map initialization
          });
        },
        (err) => {
          console.error(err);
          setError("Geolocation failed. Please enable location services.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  return (
    <UserLayout image={bgImage}>
      <MDBox
        m={9}
        p={3}
        style={{ backgroundColor: "#fff", borderRadius: "8px", marginTop: "10vh" }}
      >
        <MDBox display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h4" fontWeight="medium">
            Find Nearby Parking Zones
          </MDTypography>
          <MDButton
            variant="gradient"
            color="info"
            onClick={handleFindNearby}
            disabled={loading}
            startIcon={<Icon>location_on</Icon>}
          >
            {loading ? "Finding..." : "Find My Location"}
          </MDButton>
        </MDBox>
        {error && (
          <MDTypography variant="body2" color="error" mt={2}>
            {error}
          </MDTypography>
        )}

        {/* Map and Sidebar container */}
        <MDBox mt={4} sx={{ height: "60vh", display: "flex", gap: "16px" }}>
          {/* Map container */}
          <MDBox
            flex={2}
            sx={{ border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden" }}
            ref={mapRef}
          >
            {!userLocation && (
              <MDBox
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
                textAlign="center"
                p={2}
              >
                <MDTypography variant="h6" color="text">
                  Click the button above to find nearby parking.
                </MDTypography>
              </MDBox>
            )}
          </MDBox>

          {/* Sidebar container */}
          <MDBox flex={1} sx={{ border: "1px solid #ccc", borderRadius: "8px", overflowY: "auto" }}>
            <MDBox variant="gradient" bgColor="dark" p={2} sx={{ borderBottom: "1px solid #ccc" }}>
              <MDTypography variant="h6" color="white" textAlign="center">
                Nearby Zones ({nearbyZones.length})
              </MDTypography>
            </MDBox>
            <MDBox component="ul" p={2}>
              {nearbyZones.length > 0 ? (
                nearbyZones.map((zone) => (
                  <MDBox
                    key={zone.place_id}
                    component="li"
                    p={1}
                    sx={{ borderBottom: "1px solid #eee", "&:last-child": { borderBottom: 0 } }}
                  >
                    <MDTypography variant="body1" fontWeight="bold">
                      {zone.name}
                    </MDTypography>
                    <MDTypography variant="caption" color="text">
                      {zone.vicinity}
                    </MDTypography>
                  </MDBox>
                ))
              ) : (
                <MDTypography variant="body2" color="text" textAlign="center" p={2}>
                  No parking zones found.
                </MDTypography>
              )}
            </MDBox>
          </MDBox>
        </MDBox>
      </MDBox>
    </UserLayout>
  );
};

export default FindNearbyParkingZones;
