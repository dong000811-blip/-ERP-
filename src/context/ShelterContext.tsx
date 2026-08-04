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
  addShelter: (shelter: Omit<Shelter, 'id' | 'painPoints' | 'lat' | 'lng'>) => Promise<void>;
  updateShelter: (id: string, updates: Partial<Shelter>) => Promise<void>;
  deleteShelter: (id: string) => Promise<void>;
  deleteShelters: (ids: string[]) => Promise<void>;
  getRegionalCount: (region: string) => number;
}

const ShelterContext = createContext<ShelterContextType | undefined>(undefined);

export const ShelterProvider: React.FC<{ children: React.ReactNode; overrideUser?: any }> = ({ children, overrideUser }) => {
  const [currentUser, setCurrentUser] = useState<User | any>(overrideUser || null);
  const [shelters, setShelters] = useState<Shelter[]>([]);
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
    // Fetch all shared shelters in the ERP system regardless of userId filtering
    const q = collection(db, 'shelters');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shelterData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Shelter[];
      
      // Client-side sorting substitute for server-side orderBy
      setShelters(shelterData.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      setIsLoading(false);
    }, (error) => {
      console.warn('[ShelterContext] Firestore read warning:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Self-healing: Update coordinates for existing shelters that missing precise location
  useEffect(() => {
    const missingCoords = shelters.filter(s => !s.location && (s.address || s.detailedAddress));
    if (missingCoords.length > 0 && !isLoading) {
      console.log(`[Self-Healing] Found ${missingCoords.length} shelters with missing coordinates. Updating...`);
      // Process a few at a time to avoid rate limits
      missingCoords.slice(0, 3).forEach(async (shelter) => {
        try {
          const geocodeQuery = shelter.address || shelter.detailedAddress;
          if (geocodeQuery) {
            const coords = await geocodeAddress(geocodeQuery, true);
            if (coords) {
              await updateShelter(shelter.id, { 
                lat: coords.lat, 
                lng: coords.lng,
                location: coords 
              });
            }
          }
        } catch (e) {
          console.error('[Self-Healing] Failed to update coords for:', shelter.id, e);
        }
      });
    }
  }, [shelters, isLoading]);

  const geocodeAddress = async (address: string, silent: boolean = false): Promise<{ lat: number; lng: number } | null> => {
    const win = window as any;
    if (!win.naver || !win.naver.maps || !win.naver.maps.Service) {
      if (!silent) console.error('[Geocoding] Naver Maps Service is not loaded on window object.');
      return null;
    }

    if (!address) return null;

    return new Promise((resolve) => {
      try {
        win.naver.maps.Service.geocode({ query: address }, (status: any, response: any) => {
          if (status !== win.naver.maps.Service.Status.OK) {
            if (!silent) console.error(`[Geocoding] Naver API Error. Status: ${status}`);
            resolve(null);
            return;
          }

          const result = response.v2.addresses[0];
          if (result) {
            const coords = {
              lat: parseFloat(result.y),
              lng: parseFloat(result.x)
            };
            console.log(`[Geocoding SUCCESS] "${address}" ->`, coords);
            resolve(coords);
          } else {
            if (!silent) {
              console.error(`[Geocoding ZERO_RESULTS] No results found for address: "${address}"`);
              resolve(null);
            } else {
              resolve(null);
            }
          }
        });
      } catch (err) {
        console.error('[Geocoding] Unexpected logic error:', err);
        resolve(null);
      }
    });
  };

  const regionalData = REGIONAL_SHELTER_DATA.map(regionInfo => {
    const count = shelters.filter(s => s.region === regionInfo.region).length;
    return { ...regionInfo, count };
  });

  const addShelter = async (newShelterData: Omit<Shelter, 'id' | 'painPoints' | 'lat' | 'lng'>, manualCoords?: { lat: number, lng: number }) => {
    if (!currentUser) {
      console.error('Shelter registration failed: No authenticated user.');
      throw new Error('Authentication required');
    }
    try {
      let coords = manualCoords;
      
      const geocodeQuery = newShelterData.address || newShelterData.detailedAddress;

      if (!coords && geocodeQuery) {
        console.log('Fetching coordinates for address:', geocodeQuery);
        coords = await geocodeAddress(geocodeQuery);
      }
      
      if (!coords && geocodeQuery) {
        console.warn('Geocoding failed for address. Falling back to regional coordinates if necessary.');
      }

      const regionCenter = REGIONAL_SHELTER_DATA.find(r => r.region === newShelterData.region) || REGIONAL_SHELTER_DATA[0];

      const id = `SHT-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
      const newShelter = {
        ...newShelterData,
        id,
        userId: currentUser.uid,
        painPoints: '신규 등록된 보호소입니다. 초기 연락 대기 중.',
        lat: coords?.lat ?? regionCenter.lat,
        lng: coords?.lng ?? regionCenter.lng,
        location: coords ? { lat: coords.lat, lng: coords.lng } : { lat: regionCenter.lat, lng: regionCenter.lng }
      };

      console.log('Attempting to WRITE shelter to Firestore:', id, newShelter);
      await setDoc(doc(db, 'shelters', id), newShelter);
      console.log('Shelter document successfully written to Firestore.');
    } catch (error) {
      console.error('CRITICAL: Firestore WRITE error for shelter:', error);
      handleFirestoreError(error, OperationType.WRITE, 'shelters');
    }
  };

  const updateShelter = async (id: string, updates: Partial<Shelter>, manualCoords?: { lat: number, lng: number }) => {
    try {
      console.log(`[Shelter UPDATE START] Attempting to update shelter: ${id}`, updates);
      let newCoords = manualCoords;
      
      const geocodeQuery = updates.address || updates.detailedAddress;
      
      if (!newCoords && geocodeQuery) {
        console.log(`[Shelter UPDATE] Geocoding new address: ${geocodeQuery}`);
        newCoords = await geocodeAddress(geocodeQuery);
      }

      const finalUpdates = { ...updates };
      if (newCoords) {
        (finalUpdates as any).lat = newCoords.lat;
        (finalUpdates as any).lng = newCoords.lng;
        (finalUpdates as any).location = { lat: newCoords.lat, lng: newCoords.lng };
      }

      await updateDoc(doc(db, 'shelters', id), finalUpdates);
      console.log(`[Shelter UPDATE SUCCESS] Shelter ${id} updated.`);
    } catch (error) {
      console.error(`[Shelter UPDATE FAIL] Error updating shelter ${id}:`, error);
      handleFirestoreError(error, OperationType.WRITE, 'shelters');
    }
  };

  const deleteShelter = async (id: string) => {
    try {
      console.log(`[Shelter DELETE START] Attempting to delete shelter: ${id}`);
      await deleteDoc(doc(db, 'shelters', id));
      console.log(`[Shelter DELETE SUCCESS] Shelter ${id} deleted.`);
    } catch (error) {
      console.error(`[Shelter DELETE FAIL] Error deleting shelter ${id}:`, error);
      handleFirestoreError(error, OperationType.WRITE, 'shelters');
    }
  };

  const deleteShelters = async (ids: string[]) => {
    try {
      console.log(`[Shelter BATCH DELETE START] Attempting to delete shelters:`, ids);
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, 'shelters', id));
      });
      await batch.commit();
      console.log(`[Shelter BATCH DELETE SUCCESS] ${ids.length} shelters deleted.`);
    } catch (error) {
      console.error(`[Shelter BATCH DELETE FAIL] Error during batch delete:`, error);
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
