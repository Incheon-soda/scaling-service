import { useEffect, useRef } from "react";

// Replace with actual Kakao Maps API key
const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;

declare global {
  interface Window {
    kakao: any;
  }
}

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

let sdkPromise: Promise<void> | null = null;

const loadSdk = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.kakao && window.kakao.maps) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const ready = () => {
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(() => resolve());
      } else {
        reject(new Error("Kakao Maps SDK not available"));
      }
    };

    const existing = document.querySelector(
      'script[src*="dapi.kakao.com/v2/maps/sdk.js"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      if ((window as any).kakao?.maps) {
        ready();
      } else {
        existing.addEventListener("load", ready);
        existing.addEventListener("error", () => reject(new Error("Failed to load Kakao Maps SDK")));
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = ready;
    script.onerror = () => reject(new Error("Failed to load Kakao Maps SDK"));
    document.head.appendChild(script);
  });

  return sdkPromise;
};

const KakaoMap = ({ center, level = 9, markers = [], height = 400, className, activeId }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);

  // init map
  useEffect(() => {
    let cancelled = false;
    loadSdk()
      .then(() => {
        if (cancelled || !containerRef.current || !window.kakao?.maps) return;
        const { kakao } = window;
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
        });
      })
      .catch(() => {
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:DM Serif Display, serif;color:hsl(0 0% 50%);">KAKAO MAP API</div>';
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update center
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    mapRef.current.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
  }, [center.lat, center.lng]);

  // markers
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    const { kakao } = window;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    if (infoRef.current) {
      infoRef.current.close();
      infoRef.current = null;
    }

    markers.forEach((m) => {
      const pos = new kakao.maps.LatLng(m.lat, m.lng);
      const isActive = activeId && m.id === activeId;
      const content = document.createElement("div");
      content.style.cssText = `display:inline-block;padding:6px 10px;background:${
        isActive ? "hsl(220 90% 56%)" : "hsl(0 0% 13%)"
      };color:#fff;font-size:12px;font-weight:500;border-radius:4px;white-space:nowrap;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.2);`;
      content.innerText = m.label ?? "";
      content.addEventListener("click", () => {
        if (m.info) {
          if (infoRef.current) infoRef.current.close();
          const info = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;font-family:'DM Sans',sans-serif;">${m.info}</div>`,
            removable: true,
          });
          const anchor = new kakao.maps.Marker({ position: pos });
          info.open(mapRef.current, anchor);
          infoRef.current = info;
        }
        m.onClick?.();
      });

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content,
        yAnchor: 1,
      });
      overlay.setMap(mapRef.current);
      overlaysRef.current.push(overlay);
    });
  }, [markers, activeId]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        border: "0.5px solid hsl(0 0% 80%)",
        borderRadius: "8px",
        overflow: "hidden",
        background: "hsl(0 0% 96%)",
      }}
    />
  );
};

export default KakaoMap;
