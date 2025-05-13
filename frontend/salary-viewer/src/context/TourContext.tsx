import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TourContextType {
  // 检查特定引导是否已完成
  isTourCompleted: (tourId: string) => boolean;
  // 标记特定引导为已完成
  markTourCompleted: (tourId: string) => void;
  // 重置特定引导的完成状态
  resetTour: (tourId: string) => void;
  // 重置所有引导的完成状态
  resetAllTours: () => void;
  // 获取所有已完成的引导ID
  getCompletedTours: () => string[];
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [completedTours, setCompletedTours] = useState<string[]>([]);

  // 初始化时从 localStorage 加载已完成的引导
  useEffect(() => {
    const loadCompletedTours = () => {
      const tours: string[] = [];
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('tour_completed_') && localStorage.getItem(key) === 'true') {
          tours.push(key.replace('tour_completed_', ''));
        }
      });
      setCompletedTours(tours);
    };

    loadCompletedTours();
  }, []);

  // 检查特定引导是否已完成
  const isTourCompleted = (tourId: string): boolean => {
    return completedTours.includes(tourId);
  };

  // 标记特定引导为已完成
  const markTourCompleted = (tourId: string) => {
    localStorage.setItem(`tour_completed_${tourId}`, 'true');
    setCompletedTours(prev => {
      if (!prev.includes(tourId)) {
        return [...prev, tourId];
      }
      return prev;
    });
  };

  // 重置特定引导的完成状态
  const resetTour = (tourId: string) => {
    localStorage.removeItem(`tour_completed_${tourId}`);
    setCompletedTours(prev => prev.filter(id => id !== tourId));
  };

  // 重置所有引导的完成状态
  const resetAllTours = () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('tour_completed_')) {
        localStorage.removeItem(key);
      }
    });
    setCompletedTours([]);
  };

  // 获取所有已完成的引导ID
  const getCompletedTours = (): string[] => {
    return completedTours;
  };

  const value = {
    isTourCompleted,
    markTourCompleted,
    resetTour,
    resetAllTours,
    getCompletedTours,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

// 自定义 Hook，用于在组件中使用 TourContext
export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
