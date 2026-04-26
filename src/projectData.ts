
export interface ProjectPerformance {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  purchasePrice: number;
  commission: number;
  shippingFee: number;
  vat: number;
}

export interface Project {
  id: string;
  projectName: string;
  shelterId: string;
  shelterName: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  description: string;
  type: 'logistics' | 'sales' | 'event';
  performance?: ProjectPerformance;
}

export const PROJECT_DATA: Project[] = [
  {
    id: 'PRJ-2026-001',
    projectName: '1,660kg 사료 지원 캠페인',
    shelterId: 'SHT-001',
    shelterName: '왕왕랜드',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    status: 'Completed',
    description: '기호성이 우수한 펫밸런스 사료 집중 지원 및 도착 인증 확인.',
    type: 'logistics',
    performance: {
      productId: 'PRD-001',
      productName: '넥스트 펫밸런스 어덜트 10kg',
      quantity: 166,
      sellingPrice: 58000,
      purchasePrice: 42000,
      commission: 150000,
      shippingFee: 100000,
      vat: 265600
    }
  },
  {
    id: 'PRJ-2026-002',
    projectName: '삼송보호소 시설 보수 지원',
    shelterId: 'SHT-002',
    shelterName: '삼송보호소',
    startDate: '2026-05-10',
    endDate: '2026-06-15',
    status: 'Upcoming',
    description: '노후된 견사 지붕 보수 및 단열재 보강 작업 프로젝트.',
    type: 'event'
  },
  {
    id: 'PRJ-2026-003',
    projectName: '드림테일즈 입양 캠페인 지원',
    shelterId: 'SHT-003',
    shelterName: '드림테일즈',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    status: 'Completed',
    description: '온라인 입양 활성화를 위한 캠페인 영상 제작 및 광고 지원.',
    type: 'event'
  },
  {
    id: 'PRJ-2026-004',
    projectName: '강원 유기견 보호소 의료비 후원',
    shelterId: 'SHT-005',
    shelterName: '강원 유기견 보호소',
    startDate: '2026-04-15',
    endDate: '2026-05-15',
    status: 'Ongoing',
    description: '중증 유기견 치료비 및 수술비 긴급 지원 프로젝트.',
    type: 'sales'
  }
];
