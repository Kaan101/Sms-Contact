import React, { useEffect } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import axios from 'axios';

export function UniversalMapController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const container = map.getContainer();
    if (!container) return;

    let resizeTimeout;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        map.invalidateSize();
      }, 100);
    });
    observer.observe(container);

    let ticks = 0;
    const interval = setInterval(() => {
      map.invalidateSize();
      ticks++;
      if (ticks >= 20) clearInterval(interval);
    }, 100);

    return () => {
      observer.disconnect();
      clearTimeout(resizeTimeout);
      clearInterval(interval);
    };
  }, [map]);

  useEffect(() => {
    if (center) {
      let lat, lng;
      if (Array.isArray(center) && center.length === 2) {
        lat = center[0]; lng = center[1];
      } else if (center.lat !== undefined && center.lng !== undefined) {
        lat = center.lat; lng = center.lng;
      }
      if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
        map.flyTo([lat, lng], map.getZoom() > 14 ? map.getZoom() : 16, { duration: 1.5 });
      }
    }
  }, [center, map]);
  
  return null;
}

export function SharedMapClickHandler({ position, setPosition, setLocationValue, setCoordinates, icon }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (setPosition) setPosition({ lat, lng });
      if (setCoordinates) setCoordinates(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      if (setLocationValue) setLocationValue('Adres aranıyor...');
      
      axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(res => {
           const addr = res?.data?.address || {};
           const str = [addr.amenity, addr.road, addr.suburb, addr.city || addr.town || addr.province].filter(Boolean).join(', ');
           if (setLocationValue) setLocationValue(str || 'Haritadan İşaretlendi');
        }).catch(() => {
           if (setLocationValue) setLocationValue('Haritadan İşaretlendi');
        });
    }
  });
  
  useEffect(() => {
    if (position && !isNaN(position.lat) && !isNaN(position.lng)) {
      map.flyTo(position, map.getZoom() > 14 ? map.getZoom() : 16);
    }
  }, [position, map]);

  return position && icon ? (
    <Marker position={position} icon={icon} eventHandlers={{ click: () => { if (setPosition) setPosition(null); if (setCoordinates) setCoordinates(''); if (setLocationValue) setLocationValue(''); } }} />
  ) : null;
}