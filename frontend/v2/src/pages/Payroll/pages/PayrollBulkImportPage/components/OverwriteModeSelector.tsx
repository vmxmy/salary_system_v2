import React from 'react';
import { Radio, Alert, Space, Typography } from 'antd';
import type { OverwriteMode, OverwriteModeOption } from '../types/universal';
import { OVERWRITE_MODE_OPTIONS } from '../constants/overwriteMode';

const { Text } = Typography;

interface OverwriteModeSelectorProps {
  value: OverwriteMode;
  onChange: (mode: OverwriteMode) => void;
  disabled?: boolean;
  existingCount?: number;
  showOnlyWhenNeeded?: boolean; // 新增：是否只在需要时显示
}

/**
 * 覆写模式选择器组件
 * 提供用户友好的覆写模式选择界面
 */
export const OverwriteModeSelector: React.FC<OverwriteModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  existingCount = 0,
  showOnlyWhenNeeded = false
}) => {
  const selectedOption = OVERWRITE_MODE_OPTIONS.find(opt => opt.value === value);

  const handleChange = (e: any) => {
    onChange(e.target.value);
  };

  // 如果设置了只在需要时显示，且没有已存在员工，则不显示选择器
  if (showOnlyWhenNeeded && existingCount === 0) {
    return (
      <div className="overwrite-mode-selector">
        <Alert
          message="无需选择处理方式"
          description="所有员工都是新记录，将直接添加到系统中。"
          type="info"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="overwrite-mode-selector">
      <div style={{ marginBottom: 16 }}>
        <Text strong>数据处理方式</Text>
        {existingCount > 0 && (
          <Text type="secondary" style={{ marginLeft: 8 }}>
            (检测到 {existingCount} 名已存在员工)
          </Text>
        )}
      </div>
      
      <Radio.Group 
        value={value} 
        onChange={handleChange}
        disabled={disabled}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {OVERWRITE_MODE_OPTIONS.map((option: OverwriteModeOption) => (
            <Radio 
              key={option.value} 
              value={option.value}
              style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                padding: '12px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                marginBottom: '8px',
                backgroundColor: value === option.value ? '#f6ffed' : '#fafafa'
              }}
            >
              <div style={{ marginLeft: 8, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '16px', marginRight: 8 }}>{option.icon}</span>
                  <Text strong>{option.label}</Text>
                  {option.risk === 'medium' && (
                    <Text type="warning" style={{ marginLeft: 8, fontSize: '12px' }}>
                      ⚠️ 中等风险
                    </Text>
                  )}
                  {option.risk === 'high' && (
                    <Text type="danger" style={{ marginLeft: 8, fontSize: '12px' }}>
                      🚨 高风险
                    </Text>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  {option.description}
                </Text>
              </div>
            </Radio>
          ))}
        </Space>
      </Radio.Group>

      {/* 显示选中模式的警告信息 */}
      {selectedOption?.warning && (
        <Alert
          message={selectedOption.warning}
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* 根据已存在员工数量显示相应提示 */}
      {existingCount > 0 && value === 'append' && (
        <Alert
          message={`将跳过 ${existingCount} 名已存在的员工，只添加新员工`}
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {existingCount > 0 && value === 'replace' && (
        <Alert
          message={`将更新 ${existingCount} 名已存在员工的数据，此操作不可撤销`}
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
}; 