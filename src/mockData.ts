export interface Product {
  id: string;
  no: number;
  name: string;
  category: '건식' | '습식' | '간식' | '용품' | '기타';
  standard: string; 
  unit: string; 
  purchasePrice: number;
  sellingPrice: number;
  remarks?: string;
}

export interface Shelter {
  id: string;
  name: string;
  representative: string;
  representativeGender?: 'Male' | 'Female';
  representativePhone?: string;
  managerName?: string;
  managerGender?: 'Male' | 'Female';
  managerPhone?: string;
  region: string;
  detailedAddress?: string;
  lat: number;
  lng: number;
  size: number; // Puppy count
  stage: 'Lead' | 'Sample Sent' | 'Negotiating' | 'Partnered';
  lastContactDate: string;
  painPoints: string;
}

export interface Donation {
  id: string;
  date: string;
  shelterName: string;
  eventName: string;
  itemName: string;
  volumeKg: number;
  status: 'Completed' | 'Pending';
  notes: string;
}

export interface Delivery {
  id: string;
  trackingNumber: string;
  destination: string;
  items: string;
  status: 'Order Received' | 'Preparing' | 'Shipped' | 'Delivered';
}

export const MOCK_SHELTERS: Shelter[] = [
  { 
    id: '1', 
    name: '왕왕랜드', 
    representative: '김민수', 
    representativeGender: 'Male',
    representativePhone: '010-1234-5678',
    managerName: '최숙자',
    managerGender: 'Female',
    managerPhone: '010-8765-4321',
    region: '서울', 
    detailedAddress: '서울특별시 서초구 서초대로 123',
    lat: 37.4918,
    lng: 127.0076,
    size: 150,
    stage: 'Partnered', 
    lastContactDate: '2024-04-20', 
    painPoints: '운영 효율성 문제, 고품질 사료 솔루션 필요.' 
  },
  { 
    id: '2', 
    name: '삼송 보호소', 
    representative: '이영희', 
    representativeGender: 'Female',
    region: '경기', 
    detailedAddress: '경기도 고양시 덕양구 삼송로 456',
    lat: 37.6530,
    lng: 126.8967,
    size: 280,
    stage: 'Negotiating', 
    lastContactDate: '2024-04-25', 
    painPoints: '의료 비품 및 자원봉사자 부족.' 
  },
  { 
    id: '3', 
    name: '방주 보호소', 
    representative: '박지성', 
    representativeGender: 'Male',
    region: '부산', 
    detailedAddress: '부산광역시 해운대구 해운대로 789',
    lat: 35.1631,
    lng: 129.1636,
    size: 85,
    stage: 'Sample Sent', 
    lastContactDate: '2024-04-22', 
    painPoints: '까다로운 구조 동물들을 위한 기호성 높은 사료 탐색 중.' 
  },
  { 
    id: '4', 
    name: '희망 구조대', 
    representative: '최범근', 
    representativeGender: 'Male',
    region: '인천', 
    detailedAddress: '인천광역시 남동구 인주대로 101',
    lat: 37.4472,
    lng: 126.7313,
    size: 45,
    stage: 'Lead', 
    lastContactDate: '2024-04-18', 
    painPoints: '최근 확장됨, 장기적인 파트너십 구축 희망.' 
  },
  { 
    id: '5', 
    name: '그린밸리 보호소', 
    representative: '정소민', 
    representativeGender: 'Female',
    region: '강원', 
    detailedAddress: '강원도 춘천시 강원대학길 202',
    lat: 37.8689,
    lng: 127.7441,
    size: 120,
    stage: 'Partnered', 
    lastContactDate: '2024-04-15', 
    painPoints: '운송 비용이 큰 부담이 됨.' 
  },
];

export const MOCK_DONATIONS: Donation[] = [
  { id: '1', date: '2024-04-25', shelterName: '왕왕랜드', eventName: '대량 기부', itemName: '프리미엄 성견용 사료 (고기호성)', volumeKg: 1660, status: 'Completed', notes: '기업 후원을 통해 목표 달성.' },
  { id: '2', date: '2024-04-26', shelterName: '삼송 보호소', eventName: '봄맞이 입양의 날', itemName: '퍼피 스타터 팩', volumeKg: 120, status: 'Pending', notes: '배부 진행 중.' },
  { id: '3', date: '2024-03-15', shelterName: '방주 보호소', eventName: '특별 구호', itemName: '시니어 습식 사료', volumeKg: 450, status: 'Completed', notes: '보호소 직원들로부터 만족스러운 기호성 보고됨.' },
];

export const MOCK_DELIVERIES: Delivery[] = [
  { id: '1', trackingNumber: 'SF-2024-001', destination: '삼송 보호소', items: '사료 50포', status: 'Shipped' },
  { id: '2', trackingNumber: 'SF-2024-002', destination: '방주 보호소', items: '의료 용품 박스', status: 'Preparing' },
  { id: '3', trackingNumber: 'SF-2024-003', destination: '왕왕랜드', items: '대량 사료 배송', status: 'Delivered' },
  { id: '4', trackingNumber: 'SF-2024-004', destination: '희망 구조대', items: '고양이 모래 100팩', status: 'Order Received' },
];

export const CONTACT_HISTORY = [
  { id: '1', shelterId: '1', date: '2024-04-10', message: '초기 미팅 완료. 고기호성 사료 요구사항 논의.' },
  { id: '2', shelterId: '1', date: '2024-04-15', message: '샘플 배송됨. 직원들로부터 긍정적인 피드백 받음.' },
  { id: '3', shelterId: '1', date: '2024-04-20', message: '월 1톤 이상 배송에 대한 파트너십 계약 체결.' },
];
