import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type KakaoMarker = {
  id?: string;
  lat: number;
  lng: number;
  label?: string;
  info?: string;
  onClick?: () => void;
};

type Props = {
  center: { lat: number; lng: number };
  level?: number;
  markers?: KakaoMarker[];
  height?: number | string;
  className?: string;
  activeId?: string;
};

const levelToZoom = (level: number): number => {
  const map: Record<number, number> = {
    1: 17, 2: 16, 3: 15, 4: 14, 5: 13,
    6: 12, 7: 11, 8: 10, 9: 9, 10: 8,
    11: 7, 12: 6, 13: 5, 14: 4,
  };
  return map[level] ?? 12;
};

const KakaoMap = ({ center, level = 9, markers = [], height = 400, className, activeId }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: levelToZoom(level),
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapRef.current);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    mapRef.current?.setView([center.lat, center.lng]);
  }, [center.lat, center.lng]);

  useEffect(() => {
    if (!mapRef.current) return;
    layerRef.current.forEach((l) => l.remove());
    layerRef.current = [];
    markers.forEach((m) => {
      const isActive = activeId && m.id === activeId;
      const icon = L.divIcon({
        className: "",
        html: `<div style="padding:8px 14px;background:${isActive ? "#3b82f6" : "#111"};color:#fff;font-size:14px;font-weight:500;border-radius:4px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer">${m.label ?? ""}</div>`,
        iconAnchor: [0, 0],
      });
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(mapRef.current!);
      if (m.info) marker.bindPopup(`<div style="font-size:12px;padding:4px 8px">${m.info}</div>`);
      if (m.onClick) marker.on("click", m.onClick);
      layerRef.current.push(marker);
    });
  }, [markers, activeId]);

  return (
    <div ref={containerRef} className={className} style={{
      width: "100%",
      height: typeof height === "number" ? `${height}px` : height,
      border: "0.5px solid hsl(0 0% 80%)",
      borderRadius: "8px",
      overflow: "hidden",
      background: "hsl(0 0% 96%)",
    }} />
  );
};

export default KakaoMap;
