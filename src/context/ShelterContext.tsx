import React, { createContext, useContext, useState, useEffect } from 'react';
import { Shelter, MOCK_SHELTERS } from '../mockData';
import { REGIONAL_SHELTER_DATA, ShelterData } from '../constants';

interface ShelterContextType {
  shelters: Shelter[];
  regionalData: ShelterData[];
  addShelter: (shelter: Omit<Shelter, 'id' | 'lastContactDate' | 'stage' | 'painPoints' | 'lat' | 'lng'>) => Promise<void>;
  updateShelter: (id: string, updates: Partial<Shelter>) => Promise<void>;
  deleteShelter: (id: string) => void;
  getRegionalCount: (region: string) => number;
}

const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

const ShelterContext = createContext<ShelterContextType | undefined>(undefined);

export const ShelterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shelters, setShelters] = useState<Shelter[]>(MOCK_SHELTERS);

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

  // Derive regional data from current shelters
  const regionalData = REGIONAL_SHELTER_DATA.map(regionInfo => {
    const count = shelters.filter(s => s.region === regionInfo.region).length;
    return { ...regionInfo, count };
  });

  const addShelter = async (newShelterData: Omit<Shelter, 'id' | 'lastContactDate' | 'stage' | 'painPoints' | 'lat' | 'lng'>) => {
    const coords = await geocodeAddress(newShelterData.detailedAddress || '');
    
    // Fallback to region center if geocoding fails
    const regionCenter = REGIONAL_SHELTER_DATA.find(r => r.region === newShelterData.region) || REGIONAL_SHELTER_DATA[0];

    const newShelter: Shelter = {
      ...newShelterData,
      id: `SHT-${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
      lastContactDate: new Date().toISOString().split('T')[0],
      stage: 'Lead',
      painPoints: '신규 등록된 보호소입니다. 초기 연락 대기 중.',
      lat: coords?.lat ?? regionCenter.lat,
      lng: coords?.lng ?? regionCenter.lng,
    };
    setShelters(prev => [newShelter, ...prev]);
  };

  const updateShelter = async (id: string, updates: Partial<Shelter>) => {
    let newCoords = null;
    if (updates.detailedAddress) {
      newCoords = await geocodeAddress(updates.detailedAddress);
    }

    setShelters(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        if (newCoords) {
          updated.lat = newCoords.lat;
          updated.lng = newCoords.lng;
        }
        return updated;
      }
      return s;
    }));
  };

  const deleteShelter = (id: string) => {
    setShelters(prev => prev.filter(s => s.id !== id));
  };

  const getRegionalCount = (region: string) => {
    return shelters.filter(s => s.region === region).length;
  };

  return (
    <ShelterContext.Provider value={{ shelters, regionalData, addShelter, updateShelter, deleteShelter, getRegionalCount }}>
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
