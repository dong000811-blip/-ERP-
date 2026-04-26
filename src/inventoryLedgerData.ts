
export interface InventoryEntry {
  id: string;
  date: string;
  type: '입고' | '출고';
  shelterId: string;
  shelterName: string;
  itemName: string;
  specification: string;
  quantity: number;
  balance: number;
  manager: string;
  remarks: string;
  shippingFee?: number;
}

export const INVENTORY_LEDGER_DATA: InventoryEntry[] = [
  // 시나리오 1: 왕왕랜드 분할 배송
  {
    id: 'ENT-001',
    date: '2026-04-01',
    type: '입고',
    shelterId: 'SHT-001',
    shelterName: '왕왕랜드',
    itemName: '넥스트 펫밸런스 어덜트',
    specification: '10kg',
    quantity: 2000,
    balance: 2000,
    manager: '홍길동',
    remarks: '신규 후원 물품 적립 (기업 후원)'
  },
  {
    id: 'ENT-002',
    date: '2026-04-05',
    type: '출고',
    shelterId: 'SHT-001',
    shelterName: '왕왕랜드',
    itemName: '넥스트 펫밸런스 어덜트',
    specification: '10kg',
    quantity: 1000,
    balance: 1000,
    manager: '김철수',
    remarks: '1차 출고 (서울 서북부 배송건)'
  },
  // 시나리오 2: 삼송보호소 일괄 배송
  {
    id: 'ENT-003',
    date: '2026-04-10',
    type: '입고',
    shelterId: 'SHT-002',
    shelterName: '삼송보호소',
    itemName: '퍼피 프리미엄 연어',
    specification: '5kg',
    quantity: 100,
    balance: 100,
    manager: '이영희',
    remarks: '물품 적립 (1회차)'
  },
  {
    id: 'ENT-004',
    date: '2026-04-11',
    type: '입고',
    shelterId: 'SHT-002',
    shelterName: '삼송보호소',
    itemName: '퍼피 프리미엄 연어',
    specification: '5kg',
    quantity: 100,
    balance: 200,
    manager: '이영희',
    remarks: '물품 적립 (2회차)'
  },
  {
    id: 'ENT-005',
    date: '2026-04-12',
    type: '입고',
    shelterId: 'SHT-002',
    shelterName: '삼송보호소',
    itemName: '퍼피 프리미엄 연어',
    specification: '5kg',
    quantity: 100,
    balance: 300,
    manager: '이영희',
    remarks: '물품 적립 (3회차)'
  },
  {
    id: 'ENT-006',
    date: '2026-04-13',
    type: '입고',
    shelterId: 'SHT-002',
    shelterName: '삼송보호소',
    itemName: '퍼피 프리미엄 연어',
    specification: '5kg',
    quantity: 100,
    balance: 400,
    manager: '이영희',
    remarks: '물품 적립 (4회차)'
  },
  {
    id: 'ENT-007',
    date: '2026-04-14',
    type: '입고',
    shelterId: 'SHT-002',
    shelterName: '삼송보호소',
    itemName: '퍼피 프리미엄 연어',
    specification: '5kg',
    quantity: 100,
    balance: 500,
    manager: '이영희',
    remarks: '물품 적립 (5회차)'
  },
  {
    id: 'ENT-008',
    date: '2026-04-15',
    type: '출고',
    shelterId: 'SHT-002',
    shelterName: '삼송보호소',
    itemName: '퍼피 프리미엄 연어',
    specification: '5kg',
    quantity: 500,
    balance: 0,
    manager: '박민준',
    remarks: '총 500kg 일괄 출고 완료'
  }
];
