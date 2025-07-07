'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

const GEO_LOC_URL = "https://raw.githubusercontent.com/pradt2/always-online-stun/master/geoip_cache.txt";
const IPV4_URL = "https://raw.githubusercontent.com/pradt2/always-online-stun/master/valid_ipv4s.txt";
const GEO_USER_URL = `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.NEXT_PUBLIC_IPGEO_API_KEY}`;

interface StunContextType {
  stunServer: string | null;
  loading: boolean;
  error: string | null;
}

const StunContext = createContext<StunContextType>({
  stunServer: null,
  loading: true,
  error: null,
});

export const StunProvider = ({ children }: { children: ReactNode }) => {
  const [stunServer, setStunServer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchClosestStun() {
      setLoading(true);
      setError(null);
      try {
        const geoLocsResp = await fetch(GEO_LOC_URL);
        const geoLocs: Record<string, [number, number]> = await geoLocsResp.json();
        const userGeoResp = await fetch(GEO_USER_URL);
        const { latitude, longitude } = await userGeoResp.json();
        const ipv4Resp = await fetch(IPV4_URL);
        const stunList = (await ipv4Resp.text()).trim().split('\n');
        let closest: string | null = null;
        let minDist = Infinity;
        for (const addr of stunList) {
          const [ip] = addr.split(":");
          if (!ip) continue;
          const stunGeo = geoLocs[ip];
          if (!stunGeo) continue;
          const [stunLat, stunLon] = stunGeo;
          const dist = Math.sqrt(
            Math.pow(latitude - stunLat, 2) + Math.pow(longitude - stunLon, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            closest = addr;
          }
        }
        if (!cancelled) {
          setStunServer(closest);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to fetch STUN server");
          setLoading(false);
        }
      }
    }
    fetchClosestStun();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StunContext.Provider value={{ stunServer, loading, error }}>
      {children}
    </StunContext.Provider>
  );
};

export function useStunServer() {
  return useContext(StunContext);
} 