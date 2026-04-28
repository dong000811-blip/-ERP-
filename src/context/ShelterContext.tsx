import React, { createContext, useContext, useState, useEffect } from 'react';
import { Shelter } from '../mockData';
import { REGIONAL_SHELTER_DATA, ShelterData } from '../constants';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { OperationType, handleFirestoreError } from '../lib/firestoreUtils';

interface ShelterContextType {
  shelters: Shelter[];
  regionalData: ShelterData[];
  isLoading: boolean;
  currentUser: User | null;
  addShelter: (shelter: Omit<Shelter, 'id' | 'lastContactDate' | 'stage' | 'painPoints' | 'lat' | 'lng'>) => Promise<void>;
  updateShelter: (id: string, updates: Partial<Shelter>) => Promise<void>;
  deleteShelter: (id: string) => Promise<void>;
  deleteShelters: (ids: string[]) => Promise<void>;
  getRegionalCount: (region: string) => number;
}

const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

const ShelterContext = createContext<ShelterContextType | undefined>(undefined);

export const ShelterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setShelters([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, 'shelters'), 
      where('userId', '==', currentUser.uid),
      orderBy('lastContactDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shelterData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Shelter[];
      
      setShelters(shelterData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'shelters');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!API_KEY || !address) return null;
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`);
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].geometry.location;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  const regionalData = REGIONAL_SHELTER_DATA.map(regionInfo => {
    const count = shelters.filter(s => s.region === regionInfo.region).length;
    return { ...regionInfo, count };
  });

  const addShelter = async (newShelterData: Omit<Shelter, 'id' | 'lastContactDate' | 'stage' | 'painPoints' | 'lat' | 'lng'>) => {
    if (!currentUser) {
      console.error('Shelter registration failed: No authenticated user.');
      throw new Error('Authentication required');
    }
    try {
      console.log('Processing geocoding for address:', newShelterData.detailedAddress);
      const coords = await geocodeAddress(newShelterData.detailedAddress || '');
      const regionCenter = REGIONAL_SHELTER_DATA.find(r => r.region === newShelterData.region) || REGIONAL_SHELTER_DATA[0];

      const id = `SHT-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
      const newShelter = {
        ...newShelterData,
        id,
        userId: currentUser.uid,
        lastContactDate: new Date().toISOString().split('T')[0],
        stage: 'Lead',
        painPoints: '신규 등록된 보호소입니다. 초기 연락 대기 중.',
        lat: coords?.lat ?? regionCenter.lat,
        lng: coords?.lng ?? regionCenter.lng,
      };

      console.log('Attempting to WRITE shelter to Firestore:', id, newShelter);
      await setDoc(doc(db, 'shelters', id), newShelter);
      console.log('Shelter document successfully written to Firestore.');
    } catch (error) {
      console.error('CRITICAL: Firestore WRITE error for shelter:', error);
      handleFirestoreError(error, OperationType.WRITE, 'shelters');
    }
  };

  const updateShelter = async (id: string, updates: Partial<Shelter>) => {
    try {
      let newCoords = null;
      if (updates.detailedAddress) {
        newCoords = await geocodeAddress(updates.detailedAddress);
      }

      const finalUpdates = { ...updates };
      if (newCoords) {
        (finalUpdates as any).lat = newCoords.lat;
        (finalUpdates as any).lng = newCoords.lng;
      }

      await updateDoc(doc(db, 'shelters', id), finalUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'shelters');
    }
  };

  const deleteShelter = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shelters', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'shelters');
    }
  };

  const deleteShelters = async (ids: string[]) => {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, 'shelters', id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'shelters');
    }
  };

  const getRegionalCount = (region: string) => {
    return shelters.filter(s => s.region === region).length;
  };

  return (
    <ShelterContext.Provider value={{ shelters, regionalData, isLoading, currentUser, addShelter, updateShelter, deleteShelter, deleteShelters, getRegionalCount }}>
      {children}
    </ShelterContext.Provider>
  );
};

export const useShelters = () => {
  const context = useContext(ShelterContext);
  if (context === undefined) {
    throw new Error('useShelters must be used within a ShelterProvider');
  }
  return context;
};
