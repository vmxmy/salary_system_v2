/**
 * 报表说明行编辑器组件
 * @description 使用简单文本框实现说明行编辑功能，逗号分隔
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Card } from 'antd';
const { TextArea } = Input;

interface DescriptionLinesEditorProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const DescriptionLinesEditor: React.FC<DescriptionLinesEditorProps> = ({
  value = [],
  onChange,
  disabled = false,
  placeholder = '请输入说明内容，每行一个说明项，如：\n单位名称：某某公司\n单位：元\n制表时间：2024年1月',
}) => {
  // 确保 value 始终是数组
  const safeValue = Array.isArray(value) ? value : [];
  
  // 使用内部状态管理文本内容，避免输入干扰
  const [internalText, setInternalText] = React.useState(safeValue.join('\n'));
  
  // 当外部value变化时同步内部状态
  React.useEffect(() => {
    setInternalText(safeValue.join('\n'));
  }, [safeValue.join('\n')]);
  
  // 处理文本框变化 - 实时解析并更新状态
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInternalText(text);
    
    // 实时解析文本并更新外部状态
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
    onChange?.(lines);
  };

  return (
    <div>
      {/* 文本输入框 */}
      <TextArea
        value={internalText}
        onChange={handleTextChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        maxLength={1000}
        showCount
        style={{ marginBottom: 16 }}
      />

      {/* 预览效果 */}
      {safeValue.length > 0 && (
        <Card 
          size="small" 
          title="预览效果" 
          styles={{ body: { padding: '12px 16px' } }}
        >
          <div style={{ 
            background: '#fafafa', 
            padding: '8px 12px', 
            borderRadius: 4,
            fontSize: '12px',
            color: '#666',
            lineHeight: 1.8,
            whiteSpace: 'pre-line',
          }}>
            {safeValue.join('\n')}
          </div>
          <div style={{ 
            marginTop: 8,
            fontSize: '11px',
            color: '#999',
          }}>
            共 {safeValue.length} 行说明
          </div>
        </Card>
      )}
    </div>
  );
};

export default DescriptionLinesEditor; 