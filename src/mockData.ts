export interface Product {
  id: string;
  no: number;
  name: string;
  category: '건식' | '습식' | '간식' | '용품' | '기타';
  standard: string; 
  unit: string; 
  purchasePrice: number;
  isPurchaseVatIncl?: boolean;
  sellingPrice: number;
  isSalesVatIncl?: boolean;
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
  zipCode?: string;
  address?: string;
  detailedAddress?: string;
  location?: {
    lat: number;
    lng: number;
  };
  lat: number;
  lng: number;
  size: number; // Puppy count
  painPoints: string;
}

export type SalesTaskCategory = '방문 영업' | '유선 상담' | '물류 협의' | '이벤트 기획' | '기타';
export type SalesTaskPriority = '높음' | '보통' | '낮음';
export type SalesTaskStatus = '대기' | '진행중' | '보류' | '완료';

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export type RecurringType = 'None' | 'Weekly' | 'Monthly';

export interface SalesTask {
  id: string;
  shelterId: string;
  category: SalesTaskCategory;
  taskName: string;
  description: string;
  partnerIds: string[]; // Linked to partner master data
  deadline: string;
  priority: SalesTaskPriority;
  status: SalesTaskStatus;
  subTasks?: SubTask[];
  recurring?: RecurringType;
  createdAt: string;
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

export interface ActivityLog {
  id: string;
  type: 'Meeting' | 'Travel';
  title: string;
  target: string; // Partner/Shelter Name
  targetId?: string;
  location: string;
  date: string;
  status: '작성 중' | '완료' | '후속 업무 진행 중';
  
  // Meeting specific
  purposes?: string[];
  tags?: string[];
  content?: string;
  nextActions?: string;
  
  // Travel specific
  startDate?: string;
  endDate?: string;
  totalExpense?: number;
  days?: {
    day: number;
    route: string; // 출발-경유-도착
    reportAM: string;
    reportPM: string;
    images: string[];
    expenses: { item: string; amount: number }[];
  }[];
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
    zipCode: '06611',
    address: '서울특별시 서초구 서초대로 123',
    detailedAddress: '왕왕랜드 빌딩 1층',
    lat: 37.4918,
    lng: 127.0076,
    size: 150,
    painPoints: '운영 효율성 문제, 고품질 사료 솔루션 필요.' 
  },
  { 
    id: '2', 
    name: '삼송 보호소', 
    representative: '이영희', 
    representativeGender: 'Female',
    region: '경기', 
    zipCode: '10567',
    address: '경기도 고양시 덕양구 삼송로 456',
    detailedAddress: '삼송아파트 상가 201호',
    lat: 37.6530,
    lng: 126.8967,
    size: 280,
    painPoints: '의료 비품 및 자원봉사자 부족.' 
  },
  { 
    id: '3', 
    name: '방주 보호소', 
    representative: '박지성', 
    representativeGender: 'Male',
    region: '부산', 
    zipCode: '48058',
    address: '부산광역시 해운대구 해운대로 789',
    detailedAddress: '해운대 타워 15층',
    lat: 35.1631,
    lng: 129.1636,
    size: 85,
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

export const MOCK_SALES_TASKS: SalesTask[] = [
  {
    id: 't1',
    shelterId: '1',
    category: '방문 영업',
    taskName: '펫밸런스 입고 후 샘플 증정 및 피드백 수집',
    description: '신규 라인업 펫밸런스 사료 입고 확인 및 보호소 관리자 피드백 수집',
    partnerIds: ['P001'],
    deadline: '2024-05-10',
    priority: '높음',
    status: '대기',
    subTasks: [
      { id: 'st1', title: '샘플 박스 준비', isCompleted: true },
      { id: 'st2', title: '설문지 출력', isCompleted: false },
      { id: 'st3', title: '차량 배차 확인', isCompleted: false }
    ],
    createdAt: '2024-04-25'
  },
  {
    id: 't2',
    shelterId: '2',
    category: '유선 상담',
    taskName: '의료 비품 리스트 규모 파악 및 견적 안내',
    description: '삼송 보호소 필요 의료 비품 리스트 수령 및 물류팀 협의',
    partnerIds: [],
    deadline: '2024-04-20', // Overdue
    priority: '보통',
    status: '진행중',
    createdAt: '2024-04-15'
  },
  {
    id: 't3',
    shelterId: '1',
    category: '물류 협의',
    taskName: '정기 배송 일정 조정',
    description: '월간 배송량을 1.5톤으로 증량하기 위한 일정 조율',
    partnerIds: ['P003'],
    deadline: '2024-05-15',
    priority: '낮음',
    status: '완료',
    createdAt: '2024-04-20'
  }
];

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    type: 'Meeting',
    title: '왕왕랜드 대량 기부 협약 미팅',
    target: '[보호소] 왕왕랜드',
    targetId: '1',
    location: '서울 서초구 왕왕랜드 본관',
    date: '2024-04-25',
    status: '완료',
    purposes: ['파트너십 체결', '물류 최적화'],
    tags: ['장기계약', '프리미엄사료'],
    content: '대량 기부 협약서 최종 검토 및 서명 완료함.',
    nextActions: '5월 1일 첫 대량 배송 전 물류팀 최종 확인 필요'
  },
  {
    id: 'log-2',
    type: 'Travel',
    title: '경기 서북부 보호소 전국 순회 실태 조사',
    target: '경기권 주요 5개 보호소',
    location: '경기 고양, 파주 일대',
    date: '2024-05-10',
    status: '작성 중',
    startDate: '2024-05-10',
    endDate: '2024-05-12',
    totalExpense: 450000,
    days: [
      {
        day: 1,
        route: '서울-고양-파주',
        reportAM: '삼송 보호소 방문 및 시설 점검',
        reportPM: '파주 지역 가망 보호소 2곳 미팅',
        images: [],
        expenses: [
          { item: '주유비', amount: 50000 },
          { item: '식대', amount: 25000 }
        ]
      }
    ]
  }
];
