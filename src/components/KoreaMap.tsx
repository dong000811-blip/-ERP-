import { useState, useEffect, useRef } from 'react';
import { REGIONAL_SHELTER_DATA } from '../constants';
import { AlertCircle, Map as MapIcon, ArrowRight, Home } from 'lucide-react';
import { useShelters } from '../context/ShelterContext';
import { cn } from '../lib/utils';

const NAVER_CLIENT_ID = '56oihxhe3c'; // Force provided Client ID: 56oihxhe3c

export function KoreaMap({ onSelectRegion }: { onSelectRegion?: (region: string) => void }) {
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isAuthReflecting, setIsAuthReflecting] = useState(true);
  const { shelters } = useShelters();
  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  // Poll for naver object availability (loaded via index.html script tag)
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 40; 

    const checkNaver = () => {
      const win = window as any;
      if (win.naver && win.naver.maps && win.naver.maps.Map) {
        console.log('[KoreaMap] Naver Maps SDK detected from index.html.');
        setIsMapReady(true);
        setIsAuthReflecting(false);
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkNaver, 500);
        } else {
          console.error('[KoreaMap] Naver Maps SDK load timeout.');
          setMapError('네이버 지도 라이브러리를 불러오지 못했습니다. index.html의 스크립트 상태를 확인해주세요.');
        }
      }
    };

    checkNaver();

    // Hide reflection message after 10s
    const timer = setTimeout(() => setIsAuthReflecting(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Map Initialization
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    const win = window as any;
    if (!win.naver || !win.naver.maps) return;

    try {
      console.log('[KoreaMap] Initializing Naver Map (Simple Mode)...');
      
      const mapOptions = {
        center: new win.naver.maps.LatLng(37.5665, 126.9780),
        zoom: 10,
        mapTypeControl: true
      };

      // Create map instance
      const map = new win.naver.maps.Map(mapRef.current, mapOptions);
      naverMapRef.current = map;

      // Handle marker/infowindow setup separately or here simply
      const infoWindow = new win.naver.maps.InfoWindow({
        content: '',
        borderWidth: 0,
        backgroundColor: 'transparent',
        anchorSize: new win.naver.maps.Size(0, 0)
      });
      infoWindowRef.current = infoWindow;

      // Auth Error Listener
      win.naver.maps.Event.addListener(map, 'auth_error', (e: any) => {
        console.error('[Naver Maps] Auth Error:', e);
        
        // Auto-retry once using sessionStorage to prevent loops
        const retryKey = 'naver_map_retry_count';
        const retryCount = parseInt(sessionStorage.getItem(retryKey) || '0');
        
        if (retryCount < 1) {
          console.log('[KoreaMap] Authentication failed. Attempting one-time refresh...');
          sessionStorage.setItem(retryKey, (retryCount + 1).toString());
          window.location.reload();
        } else {
          setMapError('네이버 지도 인증 실패: 네이버 클라우드 플랫폼의 "서비스 대상 도메인" 설정을 확인해주세요.');
          // Reset for next manual visit if needed
          sessionStorage.removeItem(retryKey);
        }
      });

      console.log('[KoreaMap] Map instance created successfully.');
    } catch (err) {
      console.error('[KoreaMap] Initialization Exception:', err);
      setMapError('지도 초기화 실패. (코드를 확인해주세요)');
    }
  }, [isMapReady]);

  // Marker Updating Logic
  useEffect(() => {
    const win = window as any;
    if (!naverMapRef.current || !infoWindowRef.current || !win.naver?.maps) return;

    try {
      // Clear existing markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      if (!shelters || shelters.length === 0) return;

      const bounds = new win.naver.maps.LatLngBounds();
      let hasValidMarker = false;

      shelters.forEach(shelter => {
        if (shelter.lat === null || shelter.lat === undefined || shelter.lng === null || shelter.lng === undefined) return;

        try {
          const position = new win.naver.maps.LatLng(shelter.lat, shelter.lng);
          bounds.extend(position);
          hasValidMarker = true;

          const marker = new win.naver.maps.Marker({
            position,
            map: naverMapRef.current!,
            title: shelter.name
          });

          win.naver.maps.Event.addListener(marker, 'click', () => {
            setSelectedShelterId(shelter.id);
            if (infoWindowRef.current) {
              infoWindowRef.current.setContent(`
                <div style="padding:10px; min-width:150px; background:white; border-radius:8px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
                  <p style="margin:0; font-weight:bold; font-size:14px;">${shelter.name}</p>
                  <p style="margin:4px 0 0; font-size:12px; color:#64748b;">${shelter.detailedAddress || ''}</p>
                </div>
              `);
              infoWindowRef.current.open(naverMapRef.current!, marker);
            }
          });

          markersRef.current.push(marker);
        } catch (e) {
          // Ignore marker creation errors
        }
      });

      if (hasValidMarker) {
        naverMapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    } catch (err) {
      console.warn('[KoreaMap] Marker update warning:', err);
    }
  }, [shelters, isMapReady]);

  if (mapError) {
    return (
      <div className="relative w-full h-full min-h-[450px] flex flex-col items-center justify-center bg-rose-50 rounded-xl border border-dashed border-rose-300 p-10 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <AlertCircle className="text-rose-500" size={32} />
        </div>
        <h3 className="text-sm font-bold text-rose-700 mb-2">지도 로드 실패</h3>
        <p className="text-xs text-rose-400 max-w-[280px] leading-relaxed">
          {mapError}
        </p>
      </div>
    );
  }

  if (!NAVER_CLIENT_ID) {
    return (
      <div className="relative w-full h-full min-h-[450px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 p-10 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <MapIcon className="text-slate-200" size={32} />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-2">네이버 지도 통합 준비 완료</h3>
        <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mb-6">
          지도를 활성화하려면 설정 메뉴에서 <code className="bg-slate-100 px-1 rounded text-slate-600">VITE_NAVER_MAPS_CLIENT_ID</code>를 추가해주세요.
        </p>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest cursor-not-allowed opacity-50">
          <AlertCircle size={14} /> 지도 비활성
        </div>
      </div>
    );
  }

  const selectedShelter = shelters.find(s => s.id === selectedShelterId);

  return (
    <div className="relative w-full h-[450px] min-h-[450px] min-w-[300px] rounded-xl shadow-sm border border-slate-200 overflow-hidden bg-slate-50">
      <div id="map" ref={mapRef} className="w-full h-full" style={{ width: '100%', height: '100%', minHeight: '450px' }} />

      {!isMapReady && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-50">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-700">지도를 불러오는 중...</p>
          {isAuthReflecting && (
            <p className="text-[10px] text-slate-400 mt-2 animate-pulse">
              네이버 클라우드 인증 반영 대기 중 (최대 1분 소요될 수 있습니다)
            </p>
          )}
        </div>
      )}

      {/* Overlays */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none flex flex-col gap-3">
        <div className="bg-white/90 backdrop-blur-sm border border-slate-100 p-3 rounded-lg shadow-sm">
          <h3 className="text-sm font-bold text-slate-700">전국 보호소 분포 현황 (네이버)</h3>
          <p className="text-[10px] text-slate-400 font-medium tracking-tight">정밀 좌표 보정 시스템 가동 중</p>
        </div>

        <div className="bg-white/60 backdrop-blur-md border border-slate-200/50 p-3 rounded-xl shadow-xl w-48 pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">전체 보호소</span>
            <span className="text-xs font-black text-accent">{shelters.length}</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {Object.entries(
              shelters.reduce((acc: Record<string, number>, s) => {
                acc[s.region] = (acc[s.region] || 0) + 1;
                return acc;
              }, {})
            )
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .map(([region, count]) => (
                <div key={region} className="flex items-center justify-between group">
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">{region}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1 bg-slate-200/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent" 
                        style={{ width: `${((count as number) / shelters.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-700 min-w-[12px] text-right">{count as number}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-white/80 p-3 rounded-lg backdrop-blur shadow-sm border border-slate-100 min-w-[160px] pointer-events-none text-right z-10">
        <p className="text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-tight">선택된 보호소</p>
        <p className="text-lg font-bold text-slate-800 truncate max-w-[180px]">
          {selectedShelter?.name || '전체 현황'}
        </p>
        <p className="text-[10px] text-slate-400 font-medium">
          {selectedShelter ? `${selectedShelter.region} | 대표: ${selectedShelter.representative}` : '지도의 마커를 클릭하세요'}
        </p>
      </div>
    </div>
  );
}
