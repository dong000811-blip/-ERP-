
export type PartnerType = 'Individual' | 'Corporate';
export type Specialty = '물류 지원' | '수의학' | '훈련·행동' | '홍보' | '봉사' | '기타';

export interface Partner {
  id: string;
  type: PartnerType;
  name: string; // Individual name or Corporate name
  representative?: string;
  specialties: Specialty[];
  region: string;
  contact: string;
  status: 'Active' | 'Inactive';
  
  // Bank Info
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  
  // Individual specific
  birthDate?: string;
  
  // Corporate specific
  businessNumber?: string;
  managerName?: string;
  managerPosition?: string;
  billingEmail?: string;
  
  // Assets/Resources
  resourcesMemo: string;
  
  // Meta
  createdAt: string;
}

export const PARTNER_MASTER_DATA: Partner[] = [
  {
    id: 'PRT-001',
    type: 'Individual',
    name: '김도경',
    specialties: ['훈련·행동', '봉사'],
    region: '서울',
    contact: '010-1234-5678',
    status: 'Active',
    bankName: '신한은행',
    accountNumber: '110-123-456789',
    accountHolder: '김도경',
    birthDate: '1990-05-15',
    resourcesMemo: '훈련사 1급 자격증 보유, 주말 활동 가능',
    createdAt: '2024-01-10',
  },
  {
    id: 'PRT-002',
    type: 'Individual',
    name: '최민수',
    specialties: ['물류 지원'],
    region: '경기',
    contact: '010-9876-5432',
    status: 'Active',
    bankName: '국민은행',
    accountNumber: '4455-22-3333333',
    accountHolder: '최민수',
    birthDate: '1985-11-22',
    resourcesMemo: '개인 승용차(SUV) 보유, 경기 남부 지역 배송 지원 가능',
    createdAt: '2024-02-15',
  },
  {
    id: 'PRT-003',
    type: 'Corporate',
    name: '넥스트 로지스틱스',
    representative: '정해준',
    specialties: ['물류 지원'],
    region: '전국',
    contact: '02-555-1234',
    status: 'Active',
    bankName: '우리은행',
    accountNumber: '1002-111-222222',
    accountHolder: '(주)넥스트로지스틱스',
    businessNumber: '123-45-67890',
    managerName: '이강석',
    managerPosition: '팀장',
    billingEmail: 'billing@next-logis.com',
    resourcesMemo: '1톤 탑차 2대 보유, 창고 50평 운영 중',
    createdAt: '2024-03-01',
  }
];
