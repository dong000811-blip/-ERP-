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
  isLoading: boolean;
  currentUser: User | null;
  
  addDocument: (col: string, data: any) => Promise<void>;
  updateDocument: (col: string, id: string, data: any) => Promise<void>;
  deleteDocument: (col: string, id: string) => Promise<void>;
  deleteDocuments: (col: string, ids: string[]) => Promise<void>;
}

const FirestoreContext = createContext<FirestoreContextType | undefined>(undefined);

export const FirestoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<SalesTask[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setTasks([]);
      setLogs([]);
      setPartners([]);
      setProducts([]);
      setDonations([]);
      setDeliveries([]);
      setInventory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const uid = currentUser.uid;

    const unsubscibers = [
      onSnapshot(query(collection(db, 'projects'), where('userId', '==', uid)), 
        (s) => {
          const docs = s.docs.map(d => ({ ...d.data(), id: d.id } as Project));
          setProjects(docs.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')));
        },
        (e) => handleFirestoreError(e, OperationType.GET, 'projects')
      ),
      onSnapshot(query(collection(db, 'tasks'), where('userId', '==', uid)), 
        (s) => {
          const docs = s.docs.map(d => ({ ...d.data(), id: d.id } as SalesTask));
          setTasks(docs.sort((a, b) => (a.deadline || '').localeCompare(b.deadline || '')));
        },
        (e) => handleFirestoreError(e, OperationType.GET, 'tasks')
      ),
      onSnapshot(query(collection(db, 'logs'), where('userId', '==', uid)), 
        (s) => {
          const docs = s.docs.map(d => ({ ...d.data(), id: d.id } as ActivityLog));
          setLogs(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        },
        (e) => handleFirestoreError(e, OperationType.GET, 'logs')
      ),
      onSnapshot(query(collection(db, 'partners'), where('userId', '==', uid)), 
        (s) => setPartners(s.docs.map(d => ({ ...d.data(), id: d.id } as Partner))),
        (e) => handleFirestoreError(e, OperationType.GET, 'partners')
      ),
      onSnapshot(query(collection(db, 'products'), where('userId', '==', uid)), 
        (s) => setProducts(s.docs.map(d => ({ ...d.data(), id: d.id } as Product))),
        (e) => handleFirestoreError(e, OperationType.GET, 'products')
      ),
      onSnapshot(query(collection(db, 'donations'), where('userId', '==', uid)), 
        (s) => {
          const docs = s.docs.map(d => ({ ...d.data(), id: d.id } as Donation));
          setDonations(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        },
        (e) => handleFirestoreError(e, OperationType.GET, 'donations')
      ),
      onSnapshot(query(collection(db, 'deliveries'), where('userId', '==', uid)), 
        (s) => setDeliveries(s.docs.map(d => ({ ...d.data(), id: d.id } as Delivery))),
        (e) => handleFirestoreError(e, OperationType.GET, 'deliveries')
      ),
      onSnapshot(query(collection(db, 'inventory'), where('userId', '==', uid)), 
        (s) => {
          const docs = s.docs.map(d => ({ ...d.data(), id: d.id } as InventoryEntry));
          setInventory(docs.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
        },
        (e) => handleFirestoreError(e, OperationType.GET, 'inventory')
      )
    ];

    const timer = setTimeout(() => setIsLoading(false), 2000);

    return () => {
      unsubscibers.forEach(unsub => unsub());
      clearTimeout(timer);
    };
  }, [currentUser]);

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
      projects, tasks, logs, partners, products, donations, deliveries, inventory, isLoading, currentUser,
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

