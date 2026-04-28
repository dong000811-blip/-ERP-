import { useState, useEffect, useRef } from 'react';
import { REGIONAL_SHELTER_DATA } from '../constants';
import { AlertCircle, Map as MapIcon, ArrowRight, Home } from 'lucide-react';
import { useShelters } from '../context/ShelterContext';
import { cn } from '../lib/utils';

const NAVER_CLIENT_ID = '56oihxhe3c'; // Force provided Client ID

export function KoreaMap({ onSelectRegion }: { onSelectRegion?: (region: string) => void }) {
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { shelters } = useShelters();
  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  // Poll for naver object availability if not loaded yet
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 40; // Increase max attempts to 20 seconds total (500ms * 40)

    const checkNaver = () => {
      const win = window as any;
      if (win.naver && win.naver.maps && win.naver.maps.Map) {
        console.log('[KoreaMap] Naver Maps SDK detected.');
        setIsMapReady(true);
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkNaver, 500);
        } else {
          console.error('[KoreaMap] Naver Maps SDK load timeout after 20 seconds.');
          setMapError('네이버 지도 라이브러리를 불러오지 못했습니다. 네트워크 상태를 확인해주세요.');
        }
      }
    };
    checkNaver();
  }, []);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    try {
      const win = window as any;
      if (!win.naver || !win.naver.maps) {
        throw new Error('Naver object not found on window during initialization');
      }

      console.log('[KoreaMap] Initializing Naver Map instance...');
      // Initialize Map
      const mapOptions: naver.maps.MapOptions = {
        center: new win.naver.maps.LatLng(36.5, 127.8),
        zoom: 7,
        minZoom: 6,
        zoomControl: true,
        zoomControlOptions: {
          position: win.naver.maps.Position.TOP_RIGHT
        },
        mapTypeControl: true,
        mapDataControl: false
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

      // Listen for authentication errors (e.g., 401, 403)
      win.naver.maps.Event.addListener(map, 'auth_error', (e: any) => {
        console.error('[Naver Maps] Authentication failed. Check Client ID and Domain settings.', e);
        setMapError('네이버 지도 인증에 실패했습니다. 등록된 도메인과 현재 접속 도메인이 일치하는지 확인해주세요.');
      });
    } catch (err) {
      console.error('[KoreaMap] Initialization error:', err);
      setMapError('지도 초기화 중 오류가 발생했습니다.');
    }
  }, [isMapReady]);

  // Update Markers when shelters or map state change
  useEffect(() => {
    if (!naverMapRef.current || !infoWindowRef.current || !isMapReady) return;

    const win = window as any;
    if (!win.naver || !win.naver.maps) return;

    try {
      // Clear existing markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      const bounds = new win.naver.maps.LatLngBounds(
        new win.naver.maps.LatLng(33, 124),
        new win.naver.maps.LatLng(39, 131)
      );

      let hasValidMarker = false;

      shelters.forEach(shelter => {
        // Use strict null/undefined check to allow 0 coordinates
        if (shelter.lat === null || shelter.lat === undefined || shelter.lng === null || shelter.lng === undefined) {
          console.warn(`[KoreaMap] Skipping shelter ${shelter.name} due to missing coordinates:`, shelter);
          return;
        }

        try {
          const position = new win.naver.maps.LatLng(shelter.lat, shelter.lng);
          bounds.extend(position);
          hasValidMarker = true;

          const marker = new win.naver.maps.Marker({
            position,
            map: naverMapRef.current!,
            title: shelter.name,
            icon: {
              content: `
                <div class="relative group cursor-pointer">
                  <div class="w-6 h-6 bg-accent rounded-full border-2 border-white shadow-md flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <div class="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-accent"></div>
                </div>
              `,
              anchor: new win.naver.maps.Point(12, 28)
            }
          });

          win.naver.maps.Event.addListener(marker, 'click', () => {
            try {
              setSelectedShelterId(shelter.id);
              const detailButtonId = `detail-btn-${shelter.id}`;
              
              const content = `
                <div class="p-3 min-w-[200px] bg-white rounded-xl shadow-xl border border-slate-100">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-accent">🏠</span>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">보호소 정보</p>
                  </div>
                  <p class="text-sm font-bold text-slate-800">${shelter.name}</p>
                  <p class="text-[10px] text-slate-500 mt-1">${shelter.detailedAddress || '주소 정보 없음'}</p>
                  <div class="flex items-center gap-1.5 mt-2">
                    <span class="px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      shelter.stage === 'Partnered' ? "bg-green-50 text-green-600" :
                      shelter.stage === 'Negotiating' ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-500"
                    }">
                      ${shelter.stage === 'Partnered' ? '협력 완료' :
                        shelter.stage === 'Negotiating' ? '협상 중' :
                        shelter.stage === 'Sample Sent' ? '샘플 배송' : '가망 고객'}
                    </span>
                  </div>
                  <button 
                    id="${detailButtonId}"
                    class="w-full mt-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-black transition-colors"
                  >
                    기록 상세 보기
                  </button>
                </div>
              `;

              if (infoWindowRef.current) {
                infoWindowRef.current.setContent(content);
                infoWindowRef.current.open(naverMapRef.current!, marker);
              }

              // Add event listener to the details button after a short delay to ensure DOM is ready
              setTimeout(() => {
                const btn = document.getElementById(detailButtonId);
                if (btn) {
                  btn.onclick = () => onSelectRegion?.(shelter.region);
                }
              }, 100);

              if (naverMapRef.current) {
                naverMapRef.current.panTo(position);
                naverMapRef.current.setZoom(14, true);
              }
            } catch (e) {
              console.error('[KoreaMap] Marker click event error:', e);
            }
          });

          markersRef.current.push(marker);
        } catch (e) {
          console.error(`[KoreaMap] Failed to create marker for shelter ${shelter.name}:`, e);
        }
      });

      if (hasValidMarker && shelters.length > 1) {
        naverMapRef.current!.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      } else if (hasValidMarker && shelters.length === 1) {
        const singlePos = new win.naver.maps.LatLng(shelters[0].lat, shelters[0].lng);
        naverMapRef.current!.setCenter(singlePos);
        naverMapRef.current!.setZoom(13);
      }
    } catch (err) {
      console.error('[KoreaMap] Sudden layout or bounds update error:', err);
    }
  }, [shelters, onSelectRegion, isMapReady]);

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
    <div className="relative w-full h-[450px] min-h-[450px] rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div ref={mapRef} className="w-full h-full" style={{ height: '100%' }} />

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
