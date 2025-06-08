import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography } from 'antd';
import { SettingOutlined, AppstoreOutlined, TableOutlined, ExportOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportTypeManagement from './ReportTypeManagement';
import ReportPresetManagement from './ReportPresetManagement';
import BatchReportsManagement from './BatchReportsManagement';

const { Title } = Typography;
const { TabPane } = Tabs;

interface ReportConfigManagementProps {}

const ReportConfigManagement: React.FC<ReportConfigManagementProps> = () => {
  const [activeTab, setActiveTab] = useState('types');
  const location = useLocation();
  const navigate = useNavigate();

  // 根据URL参数或来源路径自动切换标签页
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    
    if (tab) {
      setActiveTab(tab);
    } else if (location.state?.from === '/batch-reports') {
      setActiveTab('batch-reports');
    }
  }, [location]);

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // 更新URL参数
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', key);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>
            <SettingOutlined /> 报表配置管理
          </Title>
          <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>
            管理报表类型定义和配置预设，支持动态配置报表生成规则
          </p>
        </div>

        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          size="large"
        >
          <TabPane
            tab={
              <span>
                <TableOutlined />
                报表类型管理
              </span>
            }
            key="types"
          >
            <ReportTypeManagement />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <AppstoreOutlined />
                配置预设管理
              </span>
            }
            key="presets"
          >
            <ReportPresetManagement />
          </TabPane>

          <TabPane
            tab={
              <span>
                <ExportOutlined />
                批量报表管理
              </span>
            }
            key="batch-reports"
          >
            <BatchReportsManagement />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ReportConfigManagement; 