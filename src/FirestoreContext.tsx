import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Shelter, 
  Product, 
  SalesTask, 
  Donation, 
  Delivery, 
  ActivityLog 
} from './mockData';
import { Project } from './projectData';
import { Partner } from './partnerMasterData';
import { InventoryEntry } from './inventoryLedgerData';
import { OperationType, handleFirestoreError } from './lib/firestoreUtils';

interface FirestoreContextType {
  projects: Project[];
  tasks: SalesTask[];
  logs: ActivityLog[];
  partners: Partner[];
  products: Product[];
  donations: Donation[];
  deliveries: Delivery[];
  inventory: InventoryEntry[];
  settlements: any[];
  adjustments: any[];
  individualSales: any[];
  naverOrders: any[];
  isLoading: boolean;
  currentUser: User | null;
  
  addDocument: (col: string, data: any) => Promise<void>;
  updateDocument: (col: string, id: string, data: any) => Promise<void>;
  deleteDocument: (col: string, id: string) => Promise<void>;
  deleteDocuments: (col: string, ids: string[]) => Promise<void>;
}

const FirestoreContext = createContext<FirestoreContextType | undefined>(undefined);

export const FirestoreProvider: React.FC<{ children: React.ReactNode; overrideUser?: any }> = ({ children, overrideUser }) => {
  const [currentUser, setCurrentUser] = useState<User | any>(overrideUser || null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<SalesTask[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [individualSales, setIndividualSales] = useState<any[]>([]);
  const [naverOrders, setNaverOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (overrideUser) {
      setCurrentUser(overrideUser);
    } else {
      const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) setCurrentUser(user);
      });
      return () => unsubscribeAuth();
    }
  }, [overrideUser]);

  useEffect(() => {
    setIsLoading(true);

    const unsubscibers = [
      onSnapshot(collection(db, 'projects'), 
        (s) => {
          const docs = s.docs.map(d => ({ ...d.data(), id: d.id } as Project));
          setProjects(docs.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')));
        },
        (e) => console.warn('[Firestore] projects read warning:', e)
      ),
      onSnapshot(collection(db, 'tasks'), 
        (s) => {
          const docs = s.docs.map(d => ({ ...d.data(), id: d.id } as SalesTask));
          setTasks(docs.sort((a, b) => (a.deadline || '').localeCompare(b.deadline || '')));
        },
        (e) => console.warn('[Firestore] tasks read warning:', e)
      ),
      onSnapshot(collection(db, 'logs'), 
        (s) => {
          const docs = s.docs.map(d => ({ ...d.data(), id: d.id } as ActivityLog));
          setLogs(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        },
        (e) => console.warn('[Firestore] logs read warning:', e)
      ),
      onSnapshot(collection(db, 'partners'), 
        (s) => setPartners(s.docs.map(d => ({ ...d.data(), id: d.id } as Partner))),
        (e) => console.warn('[Firestore] partners read warning:', e)
      ),
      onSnapshot(collection(db, 'products'), 
        (s) => setProducts(s.docs.map(d => ({ ...d.data(), id: d.id } as Product))),
        (e) => console.warn('[Firestore] products read warning:', e)
      ),
      onSnapshot(collection(db, 'donations'), 
        (s) => {
          const docs = s.docs.map(d => ({ ...d.data(), id: d.id } as Donation));
          setDonations(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        },
        (e) => console.warn('[Firestore] donations read warning:', e)
      ),
      onSnapshot(collection(db, 'deliveries'), 
        (s) => setDeliveries(s.docs.map(d => ({ ...d.data(), id: d.id } as Delivery))),
        (e) => console.warn('[Firestore] deliveries read warning:', e)
      ),
      onSnapshot(collection(db, 'inventory'), 
        (s) => {
          const docs = s.docs.map(d => ({ ...d.data(), id: d.id } as InventoryEntry));
          setInventory(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        },
        (e) => console.warn('[Firestore] inventory read warning:', e)
      ),
      onSnapshot(collection(db, 'settlements'), 
        (s) => setSettlements(s.docs.map(d => ({ ...d.data(), id: d.id }))),
        (e) => console.warn('[Firestore] settlements read warning:', e)
      ),
      onSnapshot(collection(db, 'adjustments'), 
        (s) => setAdjustments(s.docs.map(d => ({ ...d.data(), id: d.id }))),
        (e) => console.warn('[Firestore] adjustments read warning:', e)
      ),
      onSnapshot(collection(db, 'individualOrders'), 
        (s) => setIndividualSales(s.docs.map(d => ({ ...d.data(), id: d.id }))),
        (e) => console.warn('[Firestore] individualOrders read warning:', e)
      ),
      onSnapshot(collection(db, 'naverOrders'), 
        (s) => {
          const orders = s.docs.map(d => ({ 
            ...d.data(), 
            id: d.id,
            customerName: d.data().ordererName,
            recipientPhone: d.data().ordererTelNo,
            orderNumber: d.data().productOrderId,
            orderDate: d.data().syncedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          }));
          setNaverOrders(orders);
        },
        (e) => console.warn('[Firestore] naverOrders read warning:', e)
      )
    ];

    const timer = setTimeout(() => setIsLoading(false), 1000);

    return () => {
      unsubscibers.forEach(unsub => unsub());
      clearTimeout(timer);
    };
  }, []);

  const addDocument = async (col: string, data: any) => {
    if (!currentUser) {
      console.error(`Document write failed for ${col}: No authenticated user.`);
      throw new Error('Authentication required');
    }
    const id = data.id || `${col.toUpperCase()}-${Math.random().toString(36).substr(2, 9)}`;
    const finalData = { ...data, id, userId: currentUser.uid };
    try {
      console.log(`Attempting to WRITE document to ${col} inside Firestore:`, id, finalData);
      await setDoc(doc(db, col, id), finalData);
      console.log(`Document successfully written to ${col}!`);
    } catch (error) {
      console.error(`CRITICAL: Firestore WRITE error for collection ${col}:`, error);
      handleFirestoreError(error, OperationType.WRITE, col);
    }
  };

  const updateDocument = async (col: string, id: string, data: any) => {
    try {
      console.log(`[Firestore UPDATE START] Collection: ${col}, ID: ${id}`, data);
      await updateDoc(doc(db, col, id), data);
      console.log(`[Firestore UPDATE SUCCESS] Document ${id} in ${col} updated.`);
    } catch (error) {
      console.error(`[Firestore UPDATE FAIL] Error updating ${id} in ${col}:`, error);
      handleFirestoreError(error, OperationType.WRITE, col);
    }
  };

  const deleteDocument = async (col: string, id: string) => {
    try {
      console.log(`[Firestore DELETE START] Collection: ${col}, ID: ${id}`);
      await deleteDoc(doc(db, col, id));
      console.log(`[Firestore DELETE SUCCESS] Document ${id} in ${col} deleted.`);
    } catch (error) {
      console.error(`[Firestore DELETE FAIL] Error deleting ${id} in ${col}:`, error);
      handleFirestoreError(error, OperationType.WRITE, col);
    }
  };

  const deleteDocuments = async (col: string, ids: string[]) => {
    try {
      console.log(`[Firestore BATCH DELETE START] Collection: ${col}, IDs:`, ids);
      const batch = writeBatch(db);
      ids.forEach(id => batch.delete(doc(db, col, id)));
      await batch.commit();
      console.log(`[Firestore BATCH DELETE SUCCESS] ${ids.length} docs deleted from ${col}.`);
    } catch (error) {
      console.error(`[Firestore BATCH DELETE FAIL] Error in batch delete for ${col}:`, error);
      handleFirestoreError(error, OperationType.WRITE, col);
    }
  };

  return (
    <FirestoreContext.Provider value={{ 
      projects, tasks, logs, partners, products, donations, deliveries, inventory, settlements, adjustments, individualSales, naverOrders, isLoading, currentUser,
      addDocument, updateDocument, deleteDocument, deleteDocuments
    }}>
      {children}
    </FirestoreContext.Provider>
  );
};

export const useFirestore = () => {
  const context = useContext(FirestoreContext);
  if (!context) throw new Error('useFirestore must be used within FirestoreProvider');
  return context;
};

