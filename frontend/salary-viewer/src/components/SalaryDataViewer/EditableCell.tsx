import React from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import { SalaryRecord } from './SalaryContext';

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType: 'text' | 'number' | 'select';
  record: SalaryRecord;
  index: number;
  children: React.ReactNode;
  options?: { value: string; label: string }[];
}

/**
 * 可编辑单元格组件
 * 根据编辑状态显示表单控件或普通文本
 */
const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  options,
  ...restProps
}) => {
  // 根据字段类型确定表单控件
  const getInputNode = () => {
    if (inputType === 'number') {
      return <InputNumber style={{ width: '100%' }} />;
    } else if (inputType === 'select' && options) {
      return (
        <Select style={{ width: '100%' }}>
          {options.map(option => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      );
    }
    return <Input />;
  };

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: false,
              message: `请输入${title}!`,
            },
          ]}
        >
          {getInputNode()}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

export default EditableCell;
