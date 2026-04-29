import { useState, useEffect, useRef } from 'react';
import { REGIONAL_SHELTER_DATA } from '../constants';
import { AlertCircle, Map as MapIcon, ArrowRight, Home } from 'lucide-react';
import { useShelters } from '../context/ShelterContext';
import { cn } from '../lib/utils';

const NAVER_KEY_ID = 'aiiii8qhjj'; // Force provided Client ID (NCP Key ID)

export function KoreaMap({ onSelectRegion }: { onSelectRegion?: (region: string) => void }) {
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { shelters } = useShelters();
  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  // Simple Polling for naver object
  useEffect(() => {
    console.log('[KoreaMap] Naver SDK Load Status: Checking...');
    console.log('[KoreaMap] App Origin:', window.location.origin);
    
    const checkNaver = () => {
      const win = window as any;
      if (win.naver && win.naver.maps && win.naver.maps.Map) {
        console.log('[KoreaMap] Naver Maps SDK Load Status: SUCCESS');
        setIsMapReady(true);
      } else {
        setTimeout(checkNaver, 500);
      }
    };
    checkNaver();
  }, []);

  // Map Initialization (The most basic form)
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    const win = window as any;
    try {
      console.log('[KoreaMap] Attempting to create Map instance...');
      const mapOptions = {
        center: new win.naver.maps.LatLng(37.5665, 126.9780), // Seoul
        zoom: 10,
        mapTypeControl: true,
      };

      const map = new win.naver.maps.Map(mapRef.current, mapOptions);
      naverMapRef.current = map;

      const infoWindow = new win.naver.maps.InfoWindow({
        content: '',
        borderWidth: 0,
        backgroundColor: 'transparent',
        anchorSize: new win.naver.maps.Size(0, 0)
      });
      infoWindowRef.current = infoWindow;

      win.naver.maps.Event.addListener(map, 'auth_error', (e: any) => {
        console.error('[Naver Maps] Auth Error Details:', e);
        setMapError(`인증 실패. 네이버 콘솔에 아래 주소를 등록했는지 확인하세요:\n${window.location.origin}`);
      });

      console.log('[KoreaMap] Map instance created successfully.');
    } catch (err) {
      console.error('[KoreaMap] Failed to initialize map:', err);
      setMapError('지도 초기화에 실패했습니다.');
    }
  }, [isMapReady]);

  // Responsive Resizing Logic
  useEffect(() => {
    if (!naverMapRef.current || !mapRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (naverMapRef.current) {
        console.log('[KoreaMap] Map Container Resized. Refreshing Naver Map...');
        naverMapRef.current.updateSize();
      }
    });

    resizeObserver.observe(mapRef.current);
    
    // Also handle window resize as a fallback
    const handleWindowResize = () => {
      if (naverMapRef.current) {
        naverMapRef.current.updateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [isMapReady]);

  // Marker Management (Precise Geocoding)
  useEffect(() => {
    const win = window as any;
    if (!naverMapRef.current || !infoWindowRef.current || !win.naver?.maps?.Service) return;

    const updateMarkers = async () => {
      try {
        // Clear existing markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        if (!shelters || shelters.length === 0) return;

        const bounds = new win.naver.maps.LatLngBounds();
        let hasValidMarker = false;

        // Process markers
        for (const shelter of shelters) {
          try {
            let position: naver.maps.LatLng | null = null;

            // Step 1: Try to geocode the address for 100% precision as requested
            const geocodeQuery = shelter.address || shelter.detailedAddress;
            if (geocodeQuery) {
              const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
                win.naver.maps.Service.geocode({ query: geocodeQuery }, (status: any, response: any) => {
                  if (status === win.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
                    const result = response.v2.addresses[0];
                    resolve({ lat: parseFloat(result.y), lng: parseFloat(result.x) });
                  } else {
                    resolve(null);
                  }
                });
              });

              if (coords) {
                position = new win.naver.maps.LatLng(coords.lat, coords.lng);
              }
            }

            // Step 2: Fallback to existing coordinates if geocoding failed or address missing
            if (!position && shelter.lat && shelter.lng) {
              position = new win.naver.maps.LatLng(shelter.lat, shelter.lng);
            }

            if (position) {
              bounds.extend(position);
              hasValidMarker = true;

              const marker = new win.naver.maps.Marker({
                position,
                map: naverMapRef.current!,
                title: shelter.name,
                animation: win.naver.maps.Animation.DROP
              });

              win.naver.maps.Event.addListener(marker, 'click', () => {
                setSelectedShelterId(shelter.id);
                if (infoWindowRef.current) {
                  const content = `
                    <div style="padding:15px; background:white; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); border:1px solid #f1f5f9; min-width:220px;">
                      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <span style="font-size:16px;">🏠</span>
                        <p style="margin:0; font-weight:800; font-size:15px; color:#0f172a; letter-spacing:-0.02em;">${shelter.name}</p>
                      </div>
                      <div style="border-top:1px solid #f1f5f9; padding-top:8px;">
                        <p style="margin:0; font-size:11px; color:#1e293b; font-weight:700; line-height:1.4;">[${shelter.zipCode || ''}] ${shelter.address || ''}</p>
                        <p style="margin:2px 0 0; font-size:11px; color:#64748b; font-weight:500; line-height:1.4;">${shelter.detailedAddress || ''}</p>
                        <p style="margin:6px 0 0; font-size:10px; color:#94a3b8;">${shelter.region} | ${shelter.representative} 대표</p>
                      </div>
                      <div style="margin-top:10px; display:flex; gap:4px;">
                        <span style="padding:2px 6px; background:#f1f5f9; border-radius:4px; font-size:9px; font-weight:700; color:#475569;">${shelter.stage}</span>
                      </div>
                    </div>
                  `;
                  infoWindowRef.current.setContent(content);
                  infoWindowRef.current.open(naverMapRef.current!, marker);
                  naverMapRef.current!.panTo(position!);
                }
              });

              markersRef.current.push(marker);
            }
          } catch (e) {
            console.warn(`[KoreaMap] Failed to process marker for ${shelter.name}`, e);
          }
        }

        if (hasValidMarker) {
          naverMapRef.current.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });
        }
      } catch (err) {
        console.warn('[KoreaMap] Marker refresh issue:', err);
      }
    };

    updateMarkers();
  }, [shelters, isMapReady]);

  if (mapError) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-rose-50 rounded-xl border border-rose-200 p-8 text-center min-h-[500px]">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <AlertCircle className="text-rose-500" size={24} />
        </div>
        <h3 className="text-sm font-bold text-rose-800 mb-4">지도 인증 반영 대기 또는 설정 오류</h3>
        <div className="bg-white p-4 rounded-lg border border-rose-100 mb-6 w-full max-w-md">
          <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-widest text-left">현재 앱 URL (네이버 콘솔 등록용)</p>
          <code className="text-[11px] text-rose-600 font-mono break-all block text-left bg-rose-50 p-2 rounded border border-rose-100">
            {window.location.href}
          </code>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all"
        >
          페이지 새로고침 (인증 재시도)
        </button>
      </div>
    );
  }

  const selectedShelter = shelters.find(s => s.id === selectedShelterId);

  // Calculate statistics for the summary panel
  const totalShelters: number = shelters.length;
  const regionStats: Record<string, number> = shelters.reduce((acc: Record<string, number>, s) => {
    acc[s.region] = (acc[s.region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="relative w-full flex-1 min-h-[500px] mb-6 rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden bg-white flex flex-col transition-all duration-500">
      <div 
        id="map" 
        ref={mapRef} 
        className="flex-1 w-full" 
        style={{ 
          minHeight: '500px',
          borderRadius: '16px' 
        }} 
      />

      {!isMapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-50 backdrop-blur-md">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-bold text-slate-800 tracking-tight">네이버 지도 로드 중...</p>
        </div>
      )}

      {/* Slim Network Status Overlay */}
      <div className="absolute top-6 left-6 z-10 pointer-events-auto group">
        <div className="bg-white/70 backdrop-blur-md border border-white/40 p-3 rounded-2xl shadow-xl shadow-slate-900/5 min-w-[120px] transition-all duration-300 hover:bg-white/90">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-900/5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">전체 네트워크</span>
            <span className="text-sm font-black text-slate-900">{totalShelters.toString()}</span>
          </div>

          <div className="space-y-1.5">
            {Object.entries(regionStats).map(([region, count]: [string, number]) => (
              <div key={region} className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-slate-500">{region}</span>
                <span className="text-[10px] font-black text-slate-900 bg-slate-900/5 px-1.5 py-0.5 rounded-md">{count.toString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedShelter && (
        <div className="absolute bottom-6 right-6 bg-white/95 p-5 rounded-2xl shadow-2xl border border-slate-100 min-w-[240px] z-10 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2 py-1 bg-slate-900 text-[9px] font-black text-white rounded-md uppercase tracking-widest">Selected Shelter</span>
            <span className="text-[10px] font-bold text-slate-400">ID: {selectedShelter.id.slice(-4).toUpperCase()}</span>
          </div>
          <p className="text-base font-black text-slate-900 mb-2 leading-tight">{selectedShelter.name}</p>
          <div className="space-y-1.5 border-t border-slate-50 pt-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-start gap-2">
                <span className="text-slate-400 text-xs">📍</span>
                <p className="text-[11px] text-slate-800 font-bold leading-relaxed">[{selectedShelter.zipCode || ''}] {selectedShelter.address || ''}</p>
              </div>
              {selectedShelter.detailedAddress && (
                <p className="text-[10px] text-slate-500 font-medium ml-5 leading-tight">{selectedShelter.detailedAddress}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">👤</span>
              <p className="text-[11px] text-slate-500 font-bold">{selectedShelter.representative} 대표</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
