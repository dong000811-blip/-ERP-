export interface ShelterData {
  region: string;
  count: number;
  id: string;
  lat: number;
  lng: number;
}

export interface EventData {
  id: string;
  shelterName: string;
  eventName: string;
  participants: number;
  startTime: string;
}

export interface LeadShelter {
  id: string;
  name: string;
  status: 'Negotiating' | 'Waiting for Signature' | 'Contacted';
  priority: 'High' | 'Medium' | 'Low';
}

export const REGIONAL_SHELTER_DATA: ShelterData[] = [
  { id: 'seoul', region: '서울', count: 42, lat: 37.5665, lng: 126.9780 },
  { id: 'gyeonggi', region: '경기', count: 128, lat: 37.4138, lng: 127.5183 },
  { id: 'incheon', region: '인천', count: 18, lat: 37.4563, lng: 126.7052 },
  { id: 'gangwon', region: '강원', count: 24, lat: 37.8228, lng: 128.1555 },
  { id: 'chungbuk', region: '충북', count: 15, lat: 36.6357, lng: 127.4912 },
  { id: 'chungnam', region: '충남', count: 22, lat: 36.6588, lng: 126.6728 },
  { id: 'daejeon', region: '대전', count: 12, lat: 36.3504, lng: 127.3845 },
  { id: 'gyeongbuk', region: '경북', count: 35, lat: 36.5760, lng: 128.5058 },
  { id: 'gyeongnam', region: '경남', count: 41, lat: 35.2376, lng: 128.6922 },
  { id: 'daegu', region: '대구', count: 14, lat: 35.8714, lng: 128.6014 },
  { id: 'ulsan', region: '울산', count: 9, lat: 35.5392, lng: 129.3114 },
  { id: 'busan', region: '부산', count: 28, lat: 35.1796, lng: 129.0756 },
  { id: 'jeonbuk', region: '전북', count: 19, lat: 35.8204, lng: 127.1492 },
  { id: 'jeonnam', region: '전남', count: 21, lat: 34.8679, lng: 126.9910 },
  { id: 'gwangju', region: '광주', count: 11, lat: 35.1595, lng: 126.8526 },
  { id: 'jeju', region: '제주', count: 8, lat: 33.4996, lng: 126.5312 },
  { id: 'sejong', region: '세종', count: 3, lat: 36.4800, lng: 127.2890 },
];

export const LIVE_EVENTS: EventData[] = [
  { id: '1', shelterName: '서울 행복보호소', eventName: '봄맞이 입양의 날', participants: 15, startTime: '2024-04-26 14:00' },
  { id: '2', shelterName: '경기 유기견 센터', eventName: '강아지 사회화 교실', participants: 28, startTime: '2024-04-26 15:30' },
  { id: '3', shelterName: '부산 구조센터', eventName: '고양이 입양 상담회', participants: 12, startTime: '2024-04-26 16:00' },
];

export const LEAD_SHELTERS: LeadShelter[] = [
  { id: '1', name: '인천 희망보호소', status: 'Negotiating', priority: 'High' },
  { id: '2', name: '대전 프렌즈', status: 'Waiting for Signature', priority: 'High' },
  { id: '3', name: '광주 포우 헤이븐', status: 'Contacted', priority: 'Medium' },
];

export const GROWTH_DATA = [
  { month: '1월', shelters: 85 },
  { month: '2월', shelters: 94 },
  { month: '3월', shelters: 112 },
  { month: '4월', shelters: 145 },
];
