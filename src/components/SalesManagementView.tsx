import React, { useState } from 'react';
import { 
  ShoppingBag, 
  XCircle, 
  Truck, 
  Clock, 
  AlertCircle, 
  Search, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  CheckSquare, 
  Send,
  MoreVertical,
  Filter,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  recipientPhone: string;
  productName: string;
  shippingMethod: string;
  courier: string;
  invoiceNumber: string;
  orderDate: string;
  status: 'New' | 'Cancelled' | 'Pending' | 'Shipped' | 'Completed';
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-20240429-001',
    customerName: '김철수',
    recipientPhone: '010-1234-5678',
    productName: '펫발란스 시니어 독 사료 5kg',
    shippingMethod: '택배배송',
    courier: 'CJ대한통운',
    invoiceNumber: '',
    orderDate: '2024-04-29 09:30',
    status: 'New'
  },
  {
    id: '2',
    orderNumber: 'ORD-20240429-002',
    customerName: '이영희',
    recipientPhone: '010-9876-5432',
    productName: '프리미엄 관절 영양제 60정',
    shippingMethod: '택배배송',
    courier: '로젠택배',
    invoiceNumber: '6854125369',
    orderDate: '2024-04-28 14:15',
    status: 'Pending'
  },
  {
    id: '3',
    orderNumber: 'ORD-20240429-003',
    customerName: '박지민',
    recipientPhone: '010-5555-4444',
    productName: '저알러지 연어 트릿 150g',
    shippingMethod: '퀵서비스',
    courier: '기타',
    invoiceNumber: '',
    orderDate: '2024-04-28 18:45',
    status: 'Cancelled'
  },
  {
    id: '4',
    orderNumber: 'ORD-20240429-004',
    customerName: '최유진',
    recipientPhone: '010-3333-2222',
    productName: '천연 샴푸 & 린스 세트 (라벤더)',
    shippingMethod: '택배배송',
    courier: '한진택배',
    invoiceNumber: '',
    orderDate: '2024-04-29 11:20',
    status: 'New'
  },
  {
    id: '5',
    orderNumber: 'ORD-20240429-005',
    customerName: '정우성',
    recipientPhone: '010-8888-9999',
    productName: '커스텀 각인 이름표 (실버엠블럼)',
    shippingMethod: '택배배송',
    courier: 'CJ대한통운',
    invoiceNumber: '7412589632',
    orderDate: '2024-04-27 10:05',
    status: 'Shipped'
  }
];

export default function SalesManagementView() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const stats = [
    { label: '신규주문', count: 12, icon: ShoppingBag, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: '취소요청', count: 2, icon: XCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: '발송대기', count: 8, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: '발송마감 D-1', count: 5, icon: AlertCircle, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: '발송마감 D-day', count: 3, icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden p-1">
      {/* 1. Status Dashboard Area */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 shrink-0">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <MoreVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <h3 className="text-2xl font-black text-slate-800">{stat.count}</h3>
              <span className="text-[0.625rem] font-bold text-slate-400">건</span>
            </div>
          </motion.div>
        ))}
      </section>

      {/* 2. Filter Section */}
      <section className="bg-slate-50/50 rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Date Range */}
          <div className="lg:col-span-5 space-y-2">
            <label className="text-[0.6875rem] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
              <Calendar className="w-3 h-3 text-accent" /> 조회기간
            </label>
            <div className="flex items-center gap-2">
              <div className="flex p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                {['오늘', '1주일', '1개월'].map(period => (
                  <button 
                    key={period}
                    className="px-4 py-2 text-[0.6875rem] font-bold text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
                  >
                    {period}
                  </button>
                ))}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input type="date" className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-accent/20" />
                <span className="text-slate-400">~</span>
                <input type="date" className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-accent/20" />
              </div>
            </div>
          </div>

          {/* Status & Shipping */}
          <div className="lg:col-span-4 space-y-2">
            <label className="text-[0.6875rem] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
              <Filter className="w-3 h-3 text-accent" /> 필터링
            </label>
            <div className="flex gap-2">
              <select className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer">
                <option>전체 주문상태</option>
                <option>신규주문</option>
                <option>취소요청</option>
                <option>발송대기</option>
                <option>배송중</option>
              </select>
              <select className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer">
                <option>전체 배송방법</option>
                <option>택배배송</option>
                <option>퀵서비스</option>
                <option>직접수령</option>
              </select>
            </div>
          </div>

          {/* Search Key */}
          <div className="lg:col-span-3 space-y-2">
            <label className="text-[0.6875rem] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
              <Search className="w-3 h-3 text-accent" /> 상세검색
            </label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="구매자명, 연락처, 주문번호..."
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-accent/20 pr-10"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-accent text-white rounded-md hover:opacity-90 transition-opacity">
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Actions & List Table Area */}
      <section className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col">
        {/* Action Header */}
        <div className="p-5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 bg-slate-50/10">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 active:scale-95">
              <CheckSquare className="w-3.5 h-3.5" /> 발주확인
            </button>
            <button className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-black flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-accent/20 active:scale-95">
              <Send className="w-3.5 h-3.5" /> 발송처리
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> 일괄 발송(Excel)
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> 엑셀 다운로드
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-5 w-[50px] text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-accent focus:ring-accent cursor-pointer" 
                    onChange={toggleSelectAll}
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                  />
                </th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[180px]">상품주문번호</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[100px]">구매자명</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[140px]">수취인연락처</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest">상품명</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[120px]">배송방법</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[140px]">택배사</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[160px]">송장번호</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[140px]">주문일시</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[110px]">주문상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order, idx) => (
                <tr 
                  key={order.id} 
                  className={cn(
                    "hover:bg-slate-50/50 transition-colors group",
                    selectedOrders.includes(order.id) && "bg-accent/5"
                  )}
                >
                  <td className="p-5 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-accent focus:ring-accent cursor-pointer" 
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                    />
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[0.75rem] font-black text-slate-700 font-mono">{order.orderNumber}</span>
                      <button className="text-[10px] font-bold text-accent hover:underline text-left">주문상세</button>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-xs font-black text-slate-900">{order.customerName}</span>
                  </td>
                  <td className="p-5">
                    <span className="text-[11px] font-bold text-slate-500 font-mono">{order.recipientPhone}</span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded bg-slate-100 flex-shrink-0 border border-slate-200"></div>
                       <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{order.productName}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <select className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-1 outline-none">
                      <option selected={order.shippingMethod === '택배배송'}>택배배송</option>
                      <option selected={order.shippingMethod === '퀵서비스'}>퀵서비스</option>
                      <option selected={order.shippingMethod === '방문수령'}>방문수령</option>
                    </select>
                  </td>
                  <td className="p-5">
                    <select className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-1 outline-none">
                      <option selected={order.courier === 'CJ대한통운'}>CJ대한통운</option>
                      <option selected={order.courier === '로젠택배'}>로젠택배</option>
                      <option selected={order.courier === '한진택배'}>한진택배</option>
                      <option selected={order.courier === '롯데택배'}>롯데택배</option>
                      <option selected={order.courier === '우체국'}>우체국택배</option>
                      <option selected={order.courier === '기타'}>기타</option>
                    </select>
                  </td>
                  <td className="p-5">
                    <input 
                      type="text" 
                      placeholder="송장번호입력"
                      defaultValue={order.invoiceNumber}
                      className="w-full text-[10px] font-mono font-black text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:bg-white focus:ring-1 focus:ring-accent/30 transition-all"
                    />
                  </td>
                  <td className="p-5">
                    <span className="text-[10px] font-medium text-slate-400 font-mono">{order.orderDate}</span>
                  </td>
                  <td className="p-5">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight",
                      order.status === 'New' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                      order.status === 'Cancelled' ? "bg-slate-100 text-slate-400 border border-slate-200" :
                      order.status === 'Pending' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      order.status === 'Shipped' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                      "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    )}>
                      {order.status === 'New' ? '신규주문' :
                       order.status === 'Cancelled' ? '취소완료' :
                       order.status === 'Pending' ? '발송대기' :
                       order.status === 'Shipped' ? '배송중' : '완료'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/20 flex items-center justify-center gap-2">
           {[1, 2, 3].map(p => (
             <button key={p} className={cn(
               "w-8 h-8 rounded-lg text-xs font-black transition-all",
               p === 1 ? "bg-accent text-white shadow-md shadow-accent/20" : "text-slate-400 hover:bg-slate-100"
             )}>{p}</button>
           ))}
        </div>
      </section>
    </div>
  );
}
