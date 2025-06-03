import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Upload,
  message,
  Input,
  Tabs,
  Alert,
  Typography
} from 'antd';
import {
  InboxOutlined,
  FileExcelOutlined,
  TableOutlined,
  BulbOutlined
} from '@ant-design/icons';
import type { ImportData, InputMethod } from '../types/index';
import { 
  validateFileType, 
  processCSVEncoding, 
  parseTextData, 
  filterEmptyRows, 
  cleanHeaders 
} from '../utils/fileProcessing';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Dragger } = Upload;
const { TextArea } = Input;

interface DataUploadProps {
  loading: boolean;
  onDataParsed: (data: ImportData) => void;
  onLoadingChange: (loading: boolean) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({
  loading,
  onDataParsed,
  onLoadingChange
}) => {
  const [inputMethod, setInputMethod] = useState<InputMethod>('upload');
  const [textInput, setTextInput] = useState('');

  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    onLoadingChange(true);
    try {
      console.log('📂 开始解析Excel文件:', file.name);
      
      // 验证文件类型
      if (!validateFileType(file)) {
        throw new Error('不支持的文件格式，请上传 .xlsx、.xls 或 .csv 文件');
      }
      
      // 动态导入xlsx库
      const XLSX = await import('xlsx');
      
      let workbook;
      
      // 根据文件类型处理不同的编码
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        // CSV文件需要特殊处理编码
        const csvText = await processCSVEncoding(file);
        
        // 如果检测到编码问题，给用户友好提示
        if (csvText.includes('�') || /[À-ÿ]{2,}/.test(csvText)) {
          message.warning({
            content: (
              <div>
                <div>检测到CSV文件编码问题，可能显示乱码</div>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  建议解决方案：
                  <br />• 用Excel打开CSV文件，另存为"UTF-8 CSV"格式
                  <br />• 或使用记事本打开，选择"另存为" → 编码选择"UTF-8"
                </div>
              </div>
            ),
            duration: 6
          });
        }
        
        // 使用XLSX解析CSV文本
        workbook = XLSX.read(csvText, { 
          type: 'string',
          raw: true // 保持原始数据格式
        });
      } else {
        // Excel文件正常处理
        const arrayBuffer = await file.arrayBuffer();
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      }
      
      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Excel文件中没有找到工作表');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // 将工作表转换为JSON数组
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // 使用数组格式而不是对象格式
        defval: '', // 空单元格默认值
        raw: false // 不保留原始值，转换为字符串
      });
      
      console.log('📊 解析的原始数据:', jsonData);
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error('Excel文件为空或无法解析');
      }
      
      // 提取表头和数据行
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];
      
      // 过滤掉完全空白的行
      const filteredRows = filterEmptyRows(dataRows);
      
      if (!headers || headers.length === 0) {
        throw new Error('未找到有效的表头信息');
      }
      
      if (filteredRows.length === 0) {
        throw new Error('文件中没有找到有效的数据行');
      }
      
      // 清理表头，移除空白字符
      const cleanedHeaders = cleanHeaders(headers);
      
      const parsedData: ImportData = {
        headers: cleanedHeaders,
        rows: filteredRows,
        totalRecords: filteredRows.length
      };
      
      console.log('✅ Excel解析成功:', {
        fileName: file.name,
        headers: parsedData.headers,
        totalRecords: parsedData.totalRecords,
        sampleRow: parsedData.rows[0]
      });
      
      onDataParsed(parsedData);
      message.success('文件解析成功！');
      
    } catch (error: any) {
      console.error('❌ 文件解析失败:', error);
      message.error(`文件解析失败: ${error.message}`);
    } finally {
      onLoadingChange(false);
    }
  }, [onDataParsed, onLoadingChange]);

  // 处理文本输入
  const handleTextInput = useCallback(() => {
    if (!textInput.trim()) {
      message.warning('请输入数据内容');
      return;
    }

    onLoadingChange(true);
    try {
      const { headers, rows } = parseTextData(textInput);
      const filteredRows = filterEmptyRows(rows);
      
      if (!headers || headers.length === 0) {
        throw new Error('未找到有效的表头信息');
      }
      
      if (filteredRows.length === 0) {
        throw new Error('没有找到有效的数据行');
      }
      
      const data: ImportData = {
        headers,
        rows: filteredRows,
        totalRecords: filteredRows.length
      };
      
      console.log('✅ 文本解析成功:', {
        headers: data.headers,
        totalRecords: data.totalRecords,
        sampleRow: data.rows[0]
      });
      
      onDataParsed(data);
      message.success('数据解析成功！');
      
    } catch (error: any) {
      console.error('❌ 文本解析失败:', error);
      message.error(`数据解析失败: ${error.message}`);
    } finally {
      onLoadingChange(false);
    }
  }, [textInput, onDataParsed, onLoadingChange]);

  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <BulbOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={3}>准备您的薪资数据</Title>
        <Paragraph type="secondary">
          支持多种数据输入方式，系统将自动识别和处理您的数据
        </Paragraph>
      </div>

      <Tabs activeKey={inputMethod} onChange={(key) => setInputMethod(key as InputMethod)} centered>
        <TabPane 
          tab={
            <span>
              <FileExcelOutlined />
              文件上传
            </span>
          } 
          key="upload"
        >
          <div style={{ padding: '24px 0' }}>
            <Dragger
              name="file"
              multiple={false}
              beforeUpload={(file) => {
                handleFileUpload(file);
                return false;
              }}
              showUploadList={false}
              style={{ padding: 40 }}
              disabled={loading}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 64, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 18, marginBottom: 8 }}>
                点击或拖拽文件到此区域上传
              </p>
              <p className="ant-upload-hint" style={{ fontSize: 14 }}>
                支持 Excel (.xlsx, .xls) 和 CSV 格式文件
              </p>
            </Dragger>
            
            <Alert
              style={{ marginTop: 16 }}
              message="文件格式要求"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>第一行必须是字段标题</li>
                  <li>每行代表一个员工的薪资记录</li>
                  <li>建议包含：姓名、工号、基本工资等字段</li>
                  <li><strong>CSV文件编码：</strong>推荐使用UTF-8编码，避免中文乱码</li>
                  <li><strong>编码转换：</strong>Excel → 另存为 → CSV UTF-8 / 记事本 → 另存为 → UTF-8编码</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </div>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <TableOutlined />
              表格粘贴
            </span>
          } 
          key="paste"
        >
          <div style={{ padding: '24px 0' }}>
            <TextArea
              rows={10}
              placeholder="请从Excel复制表格数据粘贴到此处..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              style={{ marginBottom: 16 }}
              disabled={loading}
            />
            
            <div style={{ textAlign: 'center' }}>
              <Button 
                type="primary" 
                size="large"
                onClick={handleTextInput}
                loading={loading}
                disabled={!textInput.trim()}
              >
                解析数据
              </Button>
            </div>
            
            <Alert
              style={{ marginTop: 16 }}
              message="粘贴说明"
              description="从Excel选中数据区域，复制后直接粘贴到上方文本框，系统会自动识别表格结构"
              type="info"
              showIcon
            />
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default DataUpload; 