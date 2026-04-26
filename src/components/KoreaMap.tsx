import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { REGIONAL_SHELTER_DATA } from '../constants';
import { AlertCircle, Map as MapIcon, ArrowRight, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { useShelters } from '../context/ShelterContext';
import { cn } from '../lib/utils';

const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

export function KoreaMap({ onSelectRegion }: { onSelectRegion?: (region: string) => void }) {
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const { shelters } = useShelters();

  const handleShelterClick = (shelterId: string, region: string) => {
    setSelectedShelterId(shelterId);
  };

  if (!API_KEY) {
    return (
      <div className="relative w-full h-full min-h-[450px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 p-10 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <MapIcon className="text-slate-200" size={32} />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-2">구글 맵 통합 준비 완료</h3>
        <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mb-6">
          지도를 활성화하려면 설정 메뉴에서 <code className="bg-slate-100 px-1 rounded text-slate-600">VITE_GOOGLE_MAPS_API_KEY</code>를 추가해주세요.
        </p>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest cursor-not-allowed opacity-50">
          <AlertCircle size={14} /> 지도 비활성
        </div>
        
        {/* Visual Fallback for Demo */}
        <div className="absolute inset-0 pointer-events-none p-10 opacity-10 flex flex-wrap gap-4 overflow-hidden">
          {shelters.map(s => (
            <div key={s.id} className="text-xs font-bold whitespace-nowrap">{s.name} ({s.region})</div>
          ))}
        </div>
      </div>
    );
  }

  const selectedShelter = shelters.find(s => s.id === selectedShelterId);

  return (
    <div className="relative w-full h-full min-h-[450px] rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={{ lat: 36.5, lng: 127.8 }}
          defaultZoom={7}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId={'bf51a910020fa25a'}
          className="w-full h-full"
        >
          {/* Individual Shelters */}
          {shelters.map((shelter) => (
            <AdvancedMarker
              key={`shelter-${shelter.id}`}
              position={{ lat: shelter.lat, lng: shelter.lng }}
              onClick={() => handleShelterClick(shelter.id, shelter.region)}
            >
              <Pin 
                background={'#FF9F1C'} 
                glyphColor={'#ffffff'} 
                borderColor={'#ffffff'}
                scale={1}
              />
            </AdvancedMarker>
          ))}

          {/* Shelter InfoWindow */}
          {selectedShelterId && selectedShelter && (
            <InfoWindow
              position={{ lat: selectedShelter.lat, lng: selectedShelter.lng }}
              onCloseClick={() => setSelectedShelterId(null)}
            >
              <div className="p-1 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <Home size={12} className="text-accent" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">보호소 정보</p>
                </div>
                <p className="text-sm font-bold text-slate-800">{selectedShelter.name}</p>
                <p className="text-[9px] text-slate-500 mt-1">{selectedShelter.detailedAddress}</p>
                <div className="flex items-center gap-1.5 mt-2">
                   <span className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-bold",
                      selectedShelter.stage === 'Partnered' ? "bg-green-50 text-green-600" :
                      selectedShelter.stage === 'Negotiating' ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-500"
                    )}>
                      {selectedShelter.stage === 'Partnered' ? '협력 완료' :
                       selectedShelter.stage === 'Negotiating' ? '협상 중' :
                       selectedShelter.stage === 'Sample Sent' ? '샘플 배송' : '가망 고객'}
                    </span>
                </div>
                <button 
                   onClick={() => onSelectRegion?.(selectedShelter.region)}
                   className="w-full mt-3 py-1.5 bg-slate-900 text-white text-[9px] font-bold rounded flex items-center justify-center gap-1.5 hover:bg-black transition-colors"
                >
                   기록 상세 보기 <ArrowRight size={10} />
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Overlays */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none flex flex-col gap-3">
        <div className="bg-white/90 backdrop-blur-sm border border-slate-100 p-3 rounded-lg shadow-sm">
          <h3 className="text-sm font-bold text-slate-700">전국 보호소 분포 현황</h3>
          <p className="text-[10px] text-slate-400 font-medium tracking-tight">실제 보호소 위치 기반 데이터</p>
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
      
      <div className="absolute bottom-4 right-4 bg-white/80 p-3 rounded-lg backdrop-blur shadow-sm border border-slate-100 min-w-[160px] pointer-events-none text-right">
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
