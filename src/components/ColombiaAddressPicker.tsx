"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Navigation,
  Home,
  Building,
  Building2,
  Store,
  Compass,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
} from "lucide-react";

export interface AddressPickerValue {
  city: string;
  department: string;
  streetAddress: string;
  housingType: "casa" | "apartamento" | "conjunto" | "local";
  buildingName?: string;
  unitDetails?: string;
  referencePoint: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  formattedSummary: string;
}

interface Props {
  initialCity?: string;
  initialAddress?: string;
  onAddressChange: (val: AddressPickerValue) => void;
}

// Principales ciudades y coordenadas de Colombia
export const COLOMBIA_CITIES = [
  { name: "Montería", dept: "Córdoba", lat: 8.74798, lng: -75.88143 },
  { name: "Cereté", dept: "Córdoba", lat: 8.8844, lng: -75.7915 },
  { name: "Sahagún", dept: "Córdoba", lat: 8.9469, lng: -75.4431 },
  { name: "Lorica", dept: "Córdoba", lat: 9.2392, lng: -75.8139 },
  { name: "Planeta Rica", dept: "Córdoba", lat: 8.4077, lng: -75.5841 },
  { name: "Montelíbano", dept: "Córdoba", lat: 7.9786, lng: -75.4175 },
  { name: "Tierralta", dept: "Córdoba", lat: 8.1728, lng: -76.0594 },
  { name: "Bogotá D.C.", dept: "Cundinamarca", lat: 4.7110, lng: -74.0721 },
  { name: "Medellín", dept: "Antioquia", lat: 6.2442, lng: -75.5812 },
  { name: "Barranquilla", dept: "Atlántico", lat: 10.9685, lng: -74.7813 },
  { name: "Cartagena", dept: "Bolívar", lat: 10.3910, lng: -75.4794 },
  { name: "Cali", dept: "Valle del Cauca", lat: 3.4516, lng: -76.5320 },
  { name: "Bucaramanga", dept: "Santander", lat: 7.1254, lng: -73.1198 },
  { name: "Sincelejo", dept: "Sucre", lat: 9.3047, lng: -75.3978 },
  { name: "Santa Marta", dept: "Magdalena", lat: 11.2408, lng: -74.1990 },
  { name: "Valledupar", dept: "Cesar", lat: 10.4631, lng: -73.2532 },
  { name: "Cúcuta", dept: "Norte de Santander", lat: 7.8939, lng: -72.5078 },
  { name: "Pereira", dept: "Risaralda", lat: 4.8133, lng: -75.6961 },
  { name: "Manizales", dept: "Caldas", lat: 5.0689, lng: -75.5174 },
  { name: "Armenia", dept: "Quindío", lat: 4.5339, lng: -75.6811 },
  { name: "Ibagué", dept: "Tolima", lat: 4.4389, lng: -75.2322 },
  { name: "Pasto", dept: "Nariño", lat: 1.2136, lng: -77.2811 },
  { name: "Villavicencio", dept: "Meta", lat: 4.1420, lng: -73.6266 },
  { name: "Neiva", dept: "Huila", lat: 2.9273, lng: -75.2819 },
  { name: "Popayán", dept: "Cauca", lat: 2.4448, lng: -76.6147 },
  { name: "Riohacha", dept: "La Guajira", lat: 11.5444, lng: -72.9072 },
  { name: "Tunja", dept: "Boyacá", lat: 5.5353, lng: -73.3678 },
  { name: "Florencia", dept: "Caquetá", lat: 1.6144, lng: -75.6062 },
  { name: "Quibdó", dept: "Chocó", lat: 5.6947, lng: -76.6611 },
  { name: "Yopal", dept: "Casanare", lat: 5.3377, lng: -72.3959 },
  { name: "San Andrés", dept: "San Andrés", lat: 12.5847, lng: -81.7006 },
];

export default function ColombiaAddressPicker({
  initialCity = "Montería",
  initialAddress = "",
  onAddressChange,
}: Props) {
  // Encontrar datos de ciudad inicial
  const defaultCityObj =
    COLOMBIA_CITIES.find((c) => c.name.toLowerCase() === initialCity.toLowerCase()) ||
    COLOMBIA_CITIES[0];

  const [selectedCity, setSelectedCity] = useState(defaultCityObj.name);
  const [department, setDepartment] = useState(defaultCityObj.dept);
  const [streetAddress, setStreetAddress] = useState(initialAddress);
  const [housingType, setHousingType] = useState<"casa" | "apartamento" | "conjunto" | "local">("casa");
  const [buildingName, setBuildingName] = useState("");
  const [unitDetails, setUnitDetails] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultCityObj.lat,
    lng: defaultCityObj.lng,
  });

  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Link directo a Google Maps para el repartidor/domiciliario
  const googleMapsUrl = `https://www.google.com/maps?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;

  // Notificar al componente padre cada vez que cambie algo
  useEffect(() => {
    let summaryParts = [streetAddress];
    if (buildingName) summaryParts.push(`Edificio/Conjunto: ${buildingName}`);
    if (unitDetails) summaryParts.push(`Detalle: ${unitDetails}`);
    if (referencePoint) summaryParts.push(`Ref: ${referencePoint}`);
    summaryParts.push(`(${selectedCity}, ${department})`);

    onAddressChange({
      city: selectedCity,
      department,
      streetAddress,
      housingType,
      buildingName,
      unitDetails,
      referencePoint,
      latitude: coords.lat,
      longitude: coords.lng,
      googleMapsUrl,
      formattedSummary: summaryParts.filter(Boolean).join(" - "),
    });
  }, [
    selectedCity,
    department,
    streetAddress,
    housingType,
    buildingName,
    unitDetails,
    referencePoint,
    coords,
    googleMapsUrl,
  ]);

  // Inicializar Leaflet dinámicamente en el cliente
  useEffect(() => {
    let isCancelled = false;

    async function initLeaflet() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      const L = (await import("leaflet")).default;

      // Inyectar CSS de Leaflet si no existe
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Icono moderno rojo para el pin
      const redMarkerHtml = `
        <div style="position: relative; width: 34px; height: 42px; transform: translate(-50%, -100%);">
          <svg viewBox="0 0 24 24" width="34" height="42" fill="none">
            <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 7.13 13.32 7.43 13.66.3.34.84.34 1.14 0C12.87 21.32 20 13.25 20 8c0-4.42-3.58-8-8-8z" fill="#E11D48"/>
            <circle cx="12" cy="8" r="3.5" fill="#FFFFFF"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-red-pin",
        html: redMarkerHtml,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        popupAnchor: [0, -42],
      });

      if (!mapInstanceRef.current && !isCancelled && mapContainerRef.current) {
        // Inicializar el mapa con coordenadas iniciales
        const map = L.map(mapContainerRef.current, {
          center: [coords.lat, coords.lng],
          zoom: 16,
          zoomControl: true,
          attributionControl: false,
        });
        mapInstanceRef.current = map;

        // Capa de mapa OpenStreetMap en vivo y en directo
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          subdomains: ["a", "b", "c"],
        }).addTo(map);

        // Marcador con pin arrastrable
        const marker = L.marker([coords.lat, coords.lng], {
          icon: customIcon,
          draggable: true,
          autoPan: true,
        }).addTo(map);
        markerInstanceRef.current = marker;

        // Evento: Al arrastrar y soltar el marcador
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
          triggerReverseGeocode(pos.lat, pos.lng);
        });

        // Evento: Al tocar o hacer clic en cualquier punto del mapa
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setCoords({ lat, lng });
          triggerReverseGeocode(lat, lng);
        });

        // Invalidate size para prevenir cajas grises en drawers/modales
        setTimeout(() => {
          map.invalidateSize();
        }, 300);
      }
    }

    initLeaflet();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Geocodificación inversa con debounce: convierte coordenadas a texto de dirección
  const triggerReverseGeocode = (lat: number, lng: number) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setReverseLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "es",
            },
          }
        );
        const data = await response.json();
        if (data && data.address) {
          const road = data.address.road || data.address.pedestrian || "";
          const houseNumber = data.address.house_number ? ` #${data.address.house_number}` : "";
          const neighbourhood =
            data.address.neighbourhood ||
            data.address.suburb ||
            data.address.residential ||
            data.address.quarter ||
            "";

          let generated = "";
          if (road) {
            generated = `${road}${houseNumber}`;
            if (neighbourhood) generated += `, Barrio ${neighbourhood}`;
          } else if (neighbourhood) {
            generated = `Barrio ${neighbourhood}`;
          } else if (data.display_name) {
            generated = data.display_name.split(",").slice(0, 3).join(",");
          }

          if (generated) {
            setStreetAddress(generated);
          }

          // Detectar ciudad si viene
          const detectedCity = data.address.city || data.address.town || data.address.village;
          if (detectedCity) {
            const match = COLOMBIA_CITIES.find(
              (c) => c.name.toLowerCase() === detectedCity.toLowerCase()
            );
            if (match) {
              setSelectedCity(match.name);
              setDepartment(match.dept);
            }
          }
        }
      } catch (err) {
        console.warn("Error en reverse geocoding:", err);
      } finally {
        setReverseLoading(false);
      }
    }, 400);
  };

  // Botón para acceder al GPS del móvil / navegador
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Tu navegador o dispositivo no soporta geolocalización.");
      return;
    }

    setLoadingGps(true);
    setGpsStatus("Obteniendo tu ubicación en tiempo real...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoadingGps(false);
        setGpsStatus(null);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCoords({ lat, lng });

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
          markerInstanceRef.current.setLatLng([lat, lng]);
        }

        triggerReverseGeocode(lat, lng);
      },
      (err) => {
        setLoadingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("Debes permitir el acceso a tu ubicación en tu teléfono.");
        } else {
          setGpsStatus("No se pudo obtener la señal GPS exacta.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Cambio de ciudad en el selector
  const handleCitySelect = (cityName: string) => {
    const cityObj = COLOMBIA_CITIES.find((c) => c.name === cityName);
    if (!cityObj) return;

    setSelectedCity(cityObj.name);
    setDepartment(cityObj.dept);
    setCoords({ lat: cityObj.lat, lng: cityObj.lng });

    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.flyTo([cityObj.lat, cityObj.lng], 15, { duration: 1.0 });
      markerInstanceRef.current.setLatLng([cityObj.lat, cityObj.lng]);
    }

    triggerReverseGeocode(cityObj.lat, cityObj.lng);
  };

  // Buscar dirección específica en Colombia
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const q = encodeURIComponent(`${searchQuery}, ${selectedCity}, Colombia`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&countrycodes=co&limit=1`,
        { headers: { "Accept-Language": "es" } }
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);

        setCoords({ lat, lng });
        setStreetAddress(searchQuery);

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.0 });
          markerInstanceRef.current.setLatLng([lat, lng]);
        }
      } else {
        alert("No encontramos esa dirección exacta en el mapa. Puedes arrastrar el pin al punto deseado.");
      }
    } catch (err) {
      console.warn("Error buscando dirección:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 shadow-xs">
      {/* CABECERA Y SELECTOR DE CIUDAD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-neutral-800 mb-1">
            Ciudad de Entrega en Colombia *
          </label>
          <select
            value={selectedCity}
            onChange={(e) => handleCitySelect(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 shadow-xs focus:border-black focus:outline-none"
          >
            {COLOMBIA_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.dept})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-800 mb-1">
            Departamento
          </label>
          <input
            type="text"
            readOnly
            value={department}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-600 outline-none"
          />
        </div>
      </div>

      {/* BOTÓN GPS DEL MÓVIL Y BUSCADOR */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="block text-xs font-bold text-neutral-800">
            Dirección en el Mapa *
          </label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={loadingGps}
            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition border border-blue-200 active:scale-95"
          >
            <Navigation className={`h-3.5 w-3.5 ${loadingGps ? "animate-spin" : ""}`} />
            <span>{loadingGps ? "Obteniendo GPS..." : "📍 Usar mi ubicación actual"}</span>
          </button>
        </div>

        {gpsStatus && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 p-2 text-[11px] font-medium text-amber-800 border border-amber-200">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{gpsStatus}</span>
          </div>
        )}

        {/* Buscador de dirección rápida */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder={`Buscar calle, carrera o barrio en ${selectedCity}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchAddress(e);
                }
              }}
              className="w-full rounded-xl border border-neutral-300 bg-white pl-8.5 pr-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 shadow-xs focus:border-black focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchAddress}
            disabled={isSearching || !searchQuery.trim()}
            className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 transition"
          >
            {isSearching ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      {/* MAPA INTERACTIVO EN VIVO */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-neutral-600 flex items-center gap-1">
            <Compass className="h-3.5 w-3.5 text-rose-600" />
            Arrastra el marcador rojo o toca la calle exacta donde vives
          </span>
          {reverseLoading && (
            <span className="text-neutral-400 animate-pulse">Calculando dirección...</span>
          )}
        </div>

        <div className="relative rounded-2xl border border-neutral-300 overflow-hidden shadow-inner bg-neutral-100">
          <div
            ref={mapContainerRef}
            className="h-56 w-full z-0"
            style={{ minHeight: "220px" }}
          />

          {/* Badge flotante de confirmación de punto GPS */}
          <div className="absolute bottom-2 left-2 right-2 z-[400] flex items-center justify-between rounded-xl bg-white/95 px-3 py-1.5 backdrop-blur-md shadow-md border border-neutral-200 text-[11px]">
            <div className="flex items-center gap-1.5 truncate text-neutral-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
              <span className="truncate font-semibold">
                Pin fijado: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 shrink-0 ml-2"
              title="Abrir en Google Maps"
            >
              <span>Ver en Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* DIRECCIÓN RESULTANTE EDITABLE */}
      <div>
        <label className="block text-xs font-bold text-neutral-800 mb-1">
          Dirección exacta y Barrio *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-rose-500" />
          <input
            type="text"
            required
            placeholder="Ej. Calle 29 #14-25, Barrio El Recreo"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-neutral-900 placeholder-neutral-400 shadow-xs focus:border-black focus:outline-none"
          />
        </div>
      </div>

      {/* SECCIÓN ESPECIFICACIONES DE LA CASA / INMUEBLE */}
      <div className="space-y-3 pt-3 border-t border-neutral-200">
        <div>
          <label className="block text-xs font-bold text-neutral-800 mb-1.5">
            Tipo de Inmueble *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "casa", label: "Casa", icon: Home },
              { id: "apartamento", label: "Apartamento", icon: Building },
              { id: "conjunto", label: "Conjunto / Urb.", icon: Building2 },
              { id: "local", label: "Local / Oficina", icon: Store },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = housingType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setHousingType(item.id as any)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-xs font-bold transition ${
                    isSelected
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campos adicionales si es Apto, Conjunto o Local */}
        {housingType !== "casa" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Nombre del Edificio / Conjunto / Centro Comercial
              </label>
              <input
                type="text"
                placeholder="Ej. Torres del Sinú, Edificio Altavista..."
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 shadow-xs focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Torre / Interior / Apto / Local #
              </label>
              <input
                type="text"
                placeholder="Ej. Torre 2, Apto 504, Piso 5"
                value={unitDetails}
                onChange={(e) => setUnitDetails(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 shadow-xs focus:border-black focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Puntos de referencia / ¿Al lado de qué queda? */}
        <div>
          <label className="block text-xs font-bold text-neutral-800 mb-1">
            Indicaciones del lugar / "¿Al lado de qué queda?" *
          </label>
          <textarea
            rows={2}
            required
            placeholder="Ej. Casa de 2 pisos color blanco, rejas negras, al lado de la panadería El Trigal, frente al parque de los niños..."
            value={referencePoint}
            onChange={(e) => setReferencePoint(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 shadow-xs focus:border-black focus:outline-none resize-none"
          />
          <p className="mt-1 text-[10px] text-neutral-500">
            Esta información le llegará directamente al domiciliario en su hoja de ruta y en el link de Maps para entregar tu pedido sin demoras.
          </p>
        </div>
      </div>
    </div>
  );
}
