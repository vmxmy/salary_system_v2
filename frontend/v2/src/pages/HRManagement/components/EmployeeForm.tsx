import React, { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, Card, TreeSelect, Spin, Upload, message } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { lookupService } from '../../../services/lookupService';
import type {
  Employee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  LookupItem,
  Department as DepartmentType,
  PositionItem,
} from '../types';

const { Option } = Select;

interface EmployeeFormProps {
  form: FormInstance; 
  initialValues?: Partial<Employee>;
  isEditMode: boolean;
  onSubmit: (values: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>;
  onCancel: () => void;
  loadingSubmit: boolean;
}

const transformToTreeData = (departments: DepartmentType[]): any[] => {
  return departments.map(dept => ({
    title: dept.label,
    value: dept.value,
    key: dept.id,
    children: dept.children ? transformToTreeData(dept.children) : [],
  }));
};

const EmployeeForm: React.FC<EmployeeFormProps> = ({ 
  form, 
  initialValues, 
  isEditMode, 
  onSubmit, 
  onCancel, 
  loadingSubmit 
}) => {
  const [loadingLookups, setLoadingLookups] = useState<boolean>(true);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [positionOptions, setPositionOptions] = useState<PositionItem[]>([]);
  const [genderOptions, setGenderOptions] = useState<LookupItem[]>([]);
  const [educationLevelOptions, setEducationLevelOptions] = useState<LookupItem[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<LookupItem[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<LookupItem[]>([]);
  const [politicalStatusOptions, setPoliticalStatusOptions] = useState<LookupItem[]>([]);
  const [contractTypeOptions, setContractTypeOptions] = useState<LookupItem[]>([]);
  const [statusOptions, setStatusOptions] = useState<LookupItem[]>([]);
  
  const [avatarFileList, setAvatarFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    const fetchLookups = async () => {
      setLoadingLookups(true);
      try {
        const [
          depts, 
          positions, 
          genders, 
          eduLevels, 
          empTypes, 
          maritals, 
          politicals, 
          contractTypesData, 
          empStatuses
        ] = await Promise.all([
          lookupService.getDepartmentsLookup(),
          lookupService.getPositionsLookup(), 
          lookupService.getGenderLookup(),
          lookupService.getEducationLevelsLookup(),
          lookupService.getEmploymentTypesLookup(),
          lookupService.getMaritalStatusesLookup(),
          lookupService.getPoliticalStatusesLookup(),
          lookupService.getContractTypesLookup(),
          lookupService.getEmployeeStatusesLookup(),
        ]);
        setDepartmentOptions(transformToTreeData(depts));
        setPositionOptions(positions);
        setGenderOptions(genders);
        setEducationLevelOptions(eduLevels);
        setEmploymentTypeOptions(empTypes);
        setMaritalStatusOptions(maritals);
        setPoliticalStatusOptions(politicals);
        setContractTypeOptions(contractTypesData);
        setStatusOptions(empStatuses);
      } catch (error) {
        message.error('加载下拉选项失败，请稍后重试');
        console.error('Failed to load lookups:', error);
      }
      setLoadingLookups(false);
    };
    fetchLookups();
  }, []);

  useEffect(() => {
    if (initialValues && !loadingLookups) {
      const processedValues: Record<string, any> = {
        ...initialValues,
        employee_code: initialValues.employee_code,
        first_name: initialValues.first_name,
        last_name: initialValues.last_name,
        dob: initialValues.dob ? dayjs(initialValues.dob) : undefined,
        hire_date: initialValues.hire_date ? dayjs(initialValues.hire_date) : undefined,
        gender_lookup_value_id: initialValues.gender_lookup_value_id !== undefined && initialValues.gender_lookup_value_id !== null 
                                ? Number(initialValues.gender_lookup_value_id) 
                                : undefined,
        status_lookup_value_id: initialValues.status_lookup_value_id !== undefined && initialValues.status_lookup_value_id !== null
                                ? Number(initialValues.status_lookup_value_id)
                                : undefined,
        education_level_lookup_value_id: initialValues.education_level_lookup_value_id !== undefined && initialValues.education_level_lookup_value_id !== null
                                ? Number(initialValues.education_level_lookup_value_id)
                                : undefined,
        employment_type_lookup_value_id: initialValues.employment_type_lookup_value_id !== undefined && initialValues.employment_type_lookup_value_id !== null
                                ? Number(initialValues.employment_type_lookup_value_id)
                                : undefined,
        marital_status_lookup_value_id: initialValues.marital_status_lookup_value_id !== undefined && initialValues.marital_status_lookup_value_id !== null
                                ? Number(initialValues.marital_status_lookup_value_id)
                                : undefined,
        political_status_lookup_value_id: initialValues.political_status_lookup_value_id !== undefined && initialValues.political_status_lookup_value_id !== null
                                ? Number(initialValues.political_status_lookup_value_id)
                                : undefined,
        contract_type_lookup_value_id: initialValues.contract_type_lookup_value_id !== undefined && initialValues.contract_type_lookup_value_id !== null
                                ? Number(initialValues.contract_type_lookup_value_id)
                                : undefined,
        department_id: initialValues.departmentId ? String(initialValues.departmentId) : undefined,
        position_id: initialValues.positionId ? String(initialValues.positionId) : undefined,
        id_number: initialValues.id_number,
      };
      
      delete processedValues.name;
      delete processedValues.hireDate;
      delete processedValues.gender;

      form.setFieldsValue(processedValues);
      if (initialValues.avatar) {
        setAvatarFileList([{
          uid: '-1',
          name: 'avatar.png',
          status: 'done',
          url: initialValues.avatar,
        }]);
      }
    }
  }, [initialValues, form, loadingLookups, genderOptions, statusOptions, educationLevelOptions, employmentTypeOptions, maritalStatusOptions, politicalStatusOptions, contractTypeOptions, departmentOptions, positionOptions]);

  const handleFormSubmit = async (formValues: any) => {
    const payload: CreateEmployeePayload | UpdateEmployeePayload = {
      ...formValues,
      dob: formValues.dob ? dayjs(formValues.dob).format('YYYY-MM-DD') : null,
      hire_date: formValues.hire_date ? dayjs(formValues.hire_date).format('YYYY-MM-DD') : null,
      gender_lookup_value_id: formValues.gender_lookup_value_id !== undefined && formValues.gender_lookup_value_id !== null ? Number(formValues.gender_lookup_value_id) : undefined,
      status_lookup_value_id: formValues.status_lookup_value_id !== undefined && formValues.status_lookup_value_id !== null ? Number(formValues.status_lookup_value_id) : undefined,
      education_level_lookup_value_id: formValues.education_level_lookup_value_id !== undefined && formValues.education_level_lookup_value_id !== null ? Number(formValues.education_level_lookup_value_id) : undefined,
      employment_type_lookup_value_id: formValues.employment_type_lookup_value_id !== undefined && formValues.employment_type_lookup_value_id !== null ? Number(formValues.employment_type_lookup_value_id) : undefined,
      marital_status_lookup_value_id: formValues.marital_status_lookup_value_id !== undefined && formValues.marital_status_lookup_value_id !== null ? Number(formValues.marital_status_lookup_value_id) : undefined,
      political_status_lookup_value_id: formValues.political_status_lookup_value_id !== undefined && formValues.political_status_lookup_value_id !== null ? Number(formValues.political_status_lookup_value_id) : undefined,
      contract_type_lookup_value_id: formValues.contract_type_lookup_value_id !== undefined && formValues.contract_type_lookup_value_id !== null ? Number(formValues.contract_type_lookup_value_id) : undefined,
      department_id: formValues.department_id !== undefined && formValues.department_id !== null ? Number(formValues.department_id) : undefined,
      position_id: formValues.position_id !== undefined && formValues.position_id !== null ? Number(formValues.position_id) : undefined,
      avatar: avatarFileList.length > 0 && avatarFileList[0].url 
              ? avatarFileList[0].url 
              : (avatarFileList.length > 0 && avatarFileList[0].response?.url 
              ? avatarFileList[0].response.url 
              : (formValues.avatar || undefined)),
    };

    if (isEditMode && initialValues?.id) {
      await onSubmit({ ...payload, id: initialValues.id } as UpdateEmployeePayload);
    } else {
      await onSubmit(payload as CreateEmployeePayload);
    }
  };
  
  const handleAvatarChange = (info: UploadChangeParam<UploadFile>) => {
    let fileList = [...info.fileList];
    fileList = fileList.slice(-1); 
    fileList = fileList.map(file => {
      if (file.response) {
        file.url = file.response.url; 
      }
      return file;
    });
    setAvatarFileList(fileList);
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 文件上传成功`);
      form.setFieldsValue({ avatar: info.file.response.url }); 
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 文件上传失败.`);
    }
  };

  if (loadingLookups) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="加载选项中..." /></div>;
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
      <Row gutter={24}>
        <Col xs={24} md={12} lg={8}>
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <Form.Item name="last_name" label="姓 (Last Name)" rules={[{ required: true, message: '请输入姓氏' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="first_name" label="名 (First Name)" rules={[{ required: true, message: '请输入名字' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="employee_code" label="员工编号" rules={[{ required: true, message: '请输入员工编号' }]}>
              <Input disabled={isEditMode} />
            </Form.Item>
            <Form.Item name="gender_lookup_value_id" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
              <Select placeholder="请选择性别" loading={loadingLookups} allowClear>
                {genderOptions.map(g => <Option key={g.value as React.Key} value={g.value}>{g.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="dob" label="出生日期" rules={[{ required: true, message: '请选择出生日期' }]}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="id_number" label="身份证号" rules={[{ required: true, message: '请输入身份证号' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="marital_status_lookup_value_id" label="婚姻状况">
              <Select placeholder="请选择婚姻状况" loading={loadingLookups} allowClear>
                {maritalStatusOptions.map(ms => <Option key={ms.value as React.Key} value={ms.value}>{ms.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="education_level_lookup_value_id" label="最高学历">
              <Select placeholder="请选择最高学历" loading={loadingLookups} allowClear>
                {educationLevelOptions.map(el => <Option key={el.value as React.Key} value={el.value}>{el.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="political_status_lookup_value_id" label="政治面貌">
              <Select placeholder="请选择政治面貌" loading={loadingLookups} allowClear>
                {politicalStatusOptions.map(ps => <Option key={ps.value as React.Key} value={ps.value}>{ps.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="nationality" label="国籍">
              <Input />
            </Form.Item>
            <Form.Item name="avatar" label="头像">
              <Upload 
                action="/api/v2/files/upload" 
                listType="picture-card"
                fileList={avatarFileList}
                onChange={handleAvatarChange}
                name="file" 
                maxCount={1}
              >
                {avatarFileList.length < 1 && <div><UploadOutlined /><div style={{marginTop: 8}}>上传</div></div>}
              </Upload>
            </Form.Item>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Card title="职位与合同信息" style={{ marginBottom: 24 }}>
            <Form.Item name="department_id" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
              <TreeSelect
                style={{ width: '100%' }}
                styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
                treeData={departmentOptions}
                placeholder="请选择部门"
                treeDefaultExpandAll
                loading={loadingLookups}
                allowClear
              />
            </Form.Item>
            <Form.Item name="position_id" label="职位" rules={[{ required: true, message: '请选择职位' }]}>
              <TreeSelect 
                style={{ width: '100%' }} 
                treeData={positionOptions} 
                placeholder="请选择职位" 
                loading={loadingLookups} 
                treeDefaultExpandAll 
                allowClear
              />
            </Form.Item>
            <Form.Item name="hire_date" label="入职日期" rules={[{ required: true, message: '请选择入职日期' }]}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="status_lookup_value_id" label="员工状态" rules={[{ required: true, message: '请选择员工状态' }]}>
              <Select placeholder="请选择员工状态" loading={loadingLookups} allowClear>
                {statusOptions.map(s => <Option key={s.value as React.Key} value={s.value}>{s.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="employment_type_lookup_value_id" label="雇佣类型">
              <Select placeholder="请选择雇佣类型" loading={loadingLookups} allowClear>
                {employmentTypeOptions.map(et => <Option key={et.value as React.Key} value={et.value}>{et.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="contract_type_lookup_value_id" label="合同类型">
              <Select placeholder="请选择合同类型" loading={loadingLookups} allowClear>
                {contractTypeOptions.map(ct => <Option key={ct.value as React.Key} value={ct.value}>{ct.label}</Option>)}
              </Select>
            </Form.Item>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Card title="联系与银行信息" style={{ marginBottom: 24 }}>
            <Form.Item name="mobile_phone" label="手机号码">
              <Input />
            </Form.Item>
            <Form.Item name="work_email" label="工作邮箱">
              <Input type="email" />
            </Form.Item>
            <Form.Item name="home_address" label="家庭住址">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="bank_name" label="开户银行">
              <Input />
            </Form.Item>
            <Form.Item name="bank_account_number" label="银行账号">
              <Input />
            </Form.Item>
            <Form.Item name="emergency_contact_name" label="紧急联系人姓名">
              <Input />
            </Form.Item>
            <Form.Item name="emergency_contact_phone" label="紧急联系人电话">
              <Input />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }} disabled={loadingSubmit}>
          取消
        </Button>
        <Button type="primary" htmlType="submit" loading={loadingSubmit}>
          {isEditMode ? '更新员工' : '创建员工'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default EmployeeForm; 