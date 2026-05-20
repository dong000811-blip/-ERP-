import React, { useState, useMemo } from 'react';
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
  RefreshCw,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useFirestore } from '../FirestoreContext';
import bcrypt from 'bcryptjs';

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
  productOrderId?: string; // Naver unique key
  shippingAddress?: string;
  totalAmount?: number;
}

export default function SalesManagementView() {
  const { naverOrders, addDocument } = useFirestore();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const orders = useMemo(() => {
    // If no synced orders, show a few mock ones for UI structure if empty, 
    // but the user wants real integration.
    return naverOrders as Order[];
  }, [naverOrders]);

  const handleNaverSync = async () => {
    const clientId = "36xxPTIKriCU6I8UUv19wm";
    const clientSecret = "$2a$04$yMEZODkzXhiUv3JMM.OJIe"; // 대문자 OD 반영
    const timestamp = Date.now();

    try {
      setIsSyncing(true);
      console.log("Make.com 웹훅으로 주문 동기화 신호 전송 시작...");
      
      // 1. 브라우저에서 안전하게 bcrypt 서명 생성
      const password = `${clientId}_${timestamp}`;
      const hashed = bcrypt.hashSync(password, clientSecret);
      const base64Signature = btoa(hashed);

      // 2. 오직 Make.com 고유 웹훅 주소로만 데이터 토스!
      const makeWebhookUrl = "https://hook.us2.make.com/vohjt1sk5rsmfbjuxmsqpg1frp4gxq3h"; 

      const response = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: clientId,
          timestamp: timestamp.toString(),
          client_secret_sign: base64Signature,
          type: "SELF",
          seller_id: "ncp_1o7ap6_01"
        })
      });

      if (response.ok) {
        console.log("Make.com에 신호 전달 완료!");
        alert("스마트스토어 주문 수집이 시작되었습니다! 슬랙 알림을 확인하세요.");
      } else {
        console.warn("Make webhook response not OK:", response.status);
        alert("수집 요청 전송에 실패했습니다. (Make.com 응답 오류)");
      }
    } catch (error: any) {
      console.error("Make 웹훅 전송 실패:", error);
      alert("연동 오류가 발생했습니다. 브라우저 콘솔을 확인해 주세요.");
    } finally {
      setIsSyncing(false);
    }
  };

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
    { label: '신규주문', count: orders.filter(o => o.status === 'New').length, icon: ShoppingBag, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: '취소요청', count: 0, icon: XCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: '발송대기', count: orders.filter(o => o.status === 'Pending').length, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: '발송마감 D-1', count: 0, icon: AlertCircle, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: '발송마감 D-day', count: 0, icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
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

      {/* 2. Sync & Actions Area */}
      <section className="bg-slate-50/10 rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
             <RefreshCw className={cn("w-5 h-5 text-emerald-600", isSyncing && "animate-spin")} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">네이버 스마트스토어 연동</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">실시간 주문 데이터 동기화 시스템</p>
          </div>
        </div>
        <button 
          onClick={handleNaverSync}
          disabled={isSyncing}
          className="px-6 py-3 bg-[#2D336B] hover:bg-[#1E234A] text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest"
        >
          {isSyncing ? '동기화 중...' : '스마트스토어 주문 동기화'}
          <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </section>

      {/* 3. Filter Section */}
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

      {/* 4. Actions & List Table Area */}
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
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors" onClick={() => window.location.reload()}>
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
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[180px]">주문번호</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[100px]">주문자명</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[140px]">연락처</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest">상품명</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[80px] text-center">수량</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[140px] text-right">총 결제액</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[200px]">배송지 주소</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[140px]">주문일시</th>
                <th className="p-5 text-[0.625rem] font-black text-slate-400 uppercase tracking-widest w-[110px]">주문상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.length > 0 ? orders.map((order, idx) => (
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
                      {order.productOrderId && <span className="text-[9px] text-slate-400 font-mono">P-ID: {order.productOrderId}</span>}
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
                       <div className="w-8 h-8 rounded bg-indigo-50 flex-shrink-0 border border-indigo-100 flex items-center justify-center">
                         <Database size={14} className="text-indigo-300" />
                       </div>
                       <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{order.productName}</span>
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <span className="text-xs font-black text-slate-600">1</span> {/* Syncing from Naver usually implies single productOrderId detail */}
                  </td>
                  <td className="p-5 text-right">
                    <span className="text-xs font-black text-indigo-600">₩{(order.totalAmount || 0).toLocaleString()}</span>
                  </td>
                  <td className="p-5">
                    <span className="text-[10px] font-bold text-slate-500 truncate block max-w-[200px]" title={order.shippingAddress}>
                      {order.shippingAddress || '-'}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="text-[10px] font-medium text-slate-400 font-mono">{order.orderDate.split('T')[0]}</span>
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
              )) : (
                <tr>
                   <td colSpan={10} className="p-20 text-center">
                     <div className="flex flex-col items-center justify-center opacity-20">
                       <ShoppingBag size={48} className="mb-4" />
                       <p className="text-sm font-black uppercase tracking-widest">수집된 주문이 없습니다</p>
                       <p className="text-xs font-bold mt-2">상단의 동기화 버튼을 눌러 스마트스토어 주문을 가져오세요</p>
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination/Status Placeholder */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between px-8">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {orders.length} Records</p>
           <div className="flex gap-2">
             {[1].map(p => (
               <button key={p} className={cn(
                 "w-8 h-8 rounded-lg text-xs font-black transition-all",
                 p === 1 ? "bg-accent text-white shadow-md shadow-accent/20" : "text-slate-400 hover:bg-slate-100"
               )}>{p}</button>
             ))}
           </div>
        </div>
      </section>
    </div>
  );
}

