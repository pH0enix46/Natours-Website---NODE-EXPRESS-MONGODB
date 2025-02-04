// // //

export const displayMap = (locations) => {
  if (!locations) return;

  // Create the map and attach it to the #map
  const map = L.map("map", {
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    dragging: true,
  });

  // Add a tile layer to the map
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &amp; <a href="https://carto.com/attributions">CartoDB</a>',
  }).addTo(map);

  // Create icon
  let greenIcon = L.icon({
    iconUrl: "/img/pin.png",
    iconSize: [32, 40],
    iconAnchor: [16, 45],
    popupAnchor: [0, -50],
  });

  // Create an array to store all markers
  let markers = [];
  const points = [];

  locations.forEach((loc) => {
    points.push([loc.coordinates[1], loc.coordinates[0]]);
    const marker = L.marker([loc.coordinates[1], loc.coordinates[0]], {
      icon: greenIcon,
    })
      .addTo(map)
      .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
        autoClose: false,
        className: "mapPopup",
      })
      .on("mouseover", function () {
        this.openPopup();
      })
      .on("mouseout", function () {
        this.closePopup();
      });

    markers.push(marker);
  });

  // Fit map to markers
  const bounds = L.latLngBounds(points).pad(0.5);
  map.fitBounds(bounds);

  // Open all popups initially
  markers.forEach((marker) => marker.openPopup());

  // Zoom on click
  map.on("click", function () {
    if (map.getZoom() < map.getMaxZoom()) {
      map.zoomIn();
    }
  });
};
