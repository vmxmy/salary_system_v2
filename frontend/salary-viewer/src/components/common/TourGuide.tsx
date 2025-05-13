import React, { useState, useEffect } from 'react';
import { Tour } from 'antd';
import type { TourProps } from 'antd';
import { useTranslation } from 'react-i18next';

export interface TourStep extends Omit<TourProps['steps'][0], 'target'> {
  target: string | (() => HTMLElement | null);
  key: string; // 用于标识步骤，便于存储完成状态
}

export interface TourGuideProps {
  /**
   * 引导的唯一标识符，用于存储完成状态
   */
  tourId: string;
  /**
   * 引导步骤
   */
  steps: TourStep[];
  /**
   * 是否自动显示引导（如果用户未完成）
   */
  autoStart?: boolean;
  /**
   * 引导完成后的回调
   */
  onFinish?: () => void;
  /**
   * 是否强制显示引导（无论用户是否已完成）
   */
  forceShow?: boolean;
}

/**
 * 通用引导组件
 * 使用 Ant Design Tour 组件实现，支持记忆用户已完成的引导
 */
const TourGuide: React.FC<TourGuideProps> = ({
  tourId,
  steps,
  autoStart = true,
  onFinish,
  forceShow = false,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // 处理步骤的 target，将字符串 selector 转换为函数
  const processedSteps: TourProps['steps'] = steps.map(step => {
    const { target, key, ...rest } = step;
    return {
      ...rest,
      target: typeof target === 'string'
        ? () => document.querySelector(target)
        : target,
    };
  });

  // 检查用户是否已完成此引导
  const checkIfCompleted = (): boolean => {
    const completed = localStorage.getItem(`tour_completed_${tourId}`);
    return completed === 'true';
  };

  // 标记引导为已完成
  const markAsCompleted = () => {
    localStorage.setItem(`tour_completed_${tourId}`, 'true');
  };

  // 重置引导完成状态
  const resetTourCompletion = () => {
    localStorage.removeItem(`tour_completed_${tourId}`);
  };

  // 初始化时检查是否应该显示引导
  useEffect(() => {
    if (forceShow || (autoStart && !checkIfCompleted())) {
      setOpen(true);
    }
  }, [autoStart, forceShow]);

  // 处理引导完成
  const handleFinish = () => {
    setOpen(false);
    markAsCompleted();
    if (onFinish) {
      onFinish();
    }
  };

  // 手动开始引导
  const startTour = () => {
    setOpen(true);
  };

  return (
    <>
      <Tour
        open={open}
        onClose={() => setOpen(false)}
        steps={processedSteps}
        onChange={(current) => {
          // 记录已完成的步骤
          if (current > 0 && steps[current - 1]) {
            setCompletedSteps(prev => [...prev, steps[current - 1].key]);
          }
        }}
        onFinish={handleFinish}
      />
    </>
  );
};

export default TourGuide;

// 导出一些辅助函数
export const resetAllTours = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('tour_completed_')) {
      localStorage.removeItem(key);
    }
  });
};

export const resetTour = (tourId: string) => {
  localStorage.removeItem(`tour_completed_${tourId}`);
};
