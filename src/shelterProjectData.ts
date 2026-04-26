import { Shelter } from './mockData';

export interface ShelterProject {
  id: string;
  title: string;
  start: string;
  end?: string;
  type: 'logistics' | 'sales' | 'event';
  shelterId: string;
  shelterName: string;
  description?: string;
}

export const SHELTER_PROJECT_DATA: ShelterProject[] = [
  {
    id: 'PROJ-001',
    title: '왕왕랜드 사료 1,660kg 입고 예정',
    start: new Date().toISOString().split('T')[0], // Today
    type: 'logistics',
    shelterId: 'SHT-001',
    shelterName: '왕왕랜드'
  },
  {
    id: 'PROJ-002',
    title: '삼송보호소 대표자 미팅',
    start: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    type: 'sales',
    shelterId: 'SHT-002',
    shelterName: '삼송보호소'
  },
  {
    id: 'PROJ-003',
    title: '드림테일즈 입양 캠페인 지원',
    start: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
    type: 'event',
    shelterId: 'SHT-003',
    shelterName: '드림테일즈'
  },
  {
    id: 'PROJ-004',
    title: '멍멍이천국 정기 정산',
    start: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    type: 'sales',
    shelterId: 'SHT-004',
    shelterName: '멍멍이천국'
  },
  {
    id: 'PROJ-005',
    title: '강원 유기견 보호소 샘플 발송',
    start: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days after
    type: 'logistics',
    shelterId: 'SHT-005',
    shelterName: '강원 유기견 보호소'
  }
];
