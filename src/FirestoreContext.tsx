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
      onSnapshot(query(collection(db, 'projects'), where('userId', '==', uid), orderBy('startDate', 'desc')), 
        (s) => setProjects(s.docs.map(d => ({ ...d.data(), id: d.id } as Project))),
        (e) => handleFirestoreError(e, OperationType.GET, 'projects')
      ),
      onSnapshot(query(collection(db, 'tasks'), where('userId', '==', uid), orderBy('deadline', 'asc')), 
        (s) => setTasks(s.docs.map(d => ({ ...d.data(), id: d.id } as SalesTask))),
        (e) => handleFirestoreError(e, OperationType.GET, 'tasks')
      ),
      onSnapshot(query(collection(db, 'logs'), where('userId', '==', uid), orderBy('date', 'desc')), 
        (s) => setLogs(s.docs.map(d => ({ ...d.data(), id: d.id } as ActivityLog))),
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
      onSnapshot(query(collection(db, 'donations'), where('userId', '==', uid), orderBy('date', 'desc')), 
        (s) => setDonations(s.docs.map(d => ({ ...d.data(), id: d.id } as Donation))),
        (e) => handleFirestoreError(e, OperationType.GET, 'donations')
      ),
      onSnapshot(query(collection(db, 'deliveries'), where('userId', '==', uid)), 
        (s) => setDeliveries(s.docs.map(d => ({ ...d.data(), id: d.id } as Delivery))),
        (e) => handleFirestoreError(e, OperationType.GET, 'deliveries')
      ),
      onSnapshot(query(collection(db, 'inventory'), where('userId', '==', uid), orderBy('date', 'desc')), 
        (s) => setInventory(s.docs.map(d => ({ ...d.data(), id: d.id } as InventoryEntry))),
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
      await updateDoc(doc(db, col, id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, col);
    }
  };

  const deleteDocument = async (col: string, id: string) => {
    try {
      await deleteDoc(doc(db, col, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, col);
    }
  };

  const deleteDocuments = async (col: string, ids: string[]) => {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => batch.delete(doc(db, col, id)));
      await batch.commit();
    } catch (error) {
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

