import React from 'react';
import { Form } from 'antd';
import { SalaryRecord } from './SalaryContext';

export interface EditableRowProps {
  index: number;
  record: SalaryRecord;
}

/**
 * 可编辑行组件
 * 为每一行提供独立的表单上下文
 */
const EditableRow: React.FC<EditableRowProps> = ({ index, record, ...restProps }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <tr {...restProps} />
    </Form>
  );
};

export default EditableRow;
