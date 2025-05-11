import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { 
  HomeOutlined, 
  TeamOutlined, 
  FileOutlined, 
  SettingOutlined, 
  LineChartOutlined,
  BuildOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import reportLinksApi from '../../services/reportLinksApi';

const { Sider } = Layout;
const { SubMenu } = Menu;
const { Text } = Typography;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [reportLinks, setReportLinks] = useState<any[]>([]);
  const [reportLinksLoading, setReportLinksLoading] = useState(false);

  // 获取当前用户角色，实际项目中应该从用户上下文获取
  const isAdmin = localStorage.getItem('userRole') === 'Super Admin';

  // 加载报表链接
  useEffect(() => {
    const fetchReportLinks = async () => {
      setReportLinksLoading(true);
      try {
        const data = await reportLinksApi.getActiveReportLinks();
        setReportLinks(data || []);
      } catch (error) {
        console.error('Error fetching report links:', error);
      } finally {
        setReportLinksLoading(false);
      }
    };

    fetchReportLinks();
  }, []);

  // 根据当前路径判断哪个菜单项处于活跃状态
  const getSelectedKey = () => {
    const path = location.pathname;

    if (path.startsWith('/dashboard')) {
      return ['dashboard'];
    } else if (path.startsWith('/employees')) {
      return ['employees'];
    } else if (path.startsWith('/departments')) {
      return ['departments'];
    } else if (path.startsWith('/salary-data')) {
      return ['salary-data'];
    } else if (path.startsWith('/report-links')) {
      return ['report-links'];
    } else if (path.startsWith('/reports/')) {
      return ['reports'];
    } else {
      return ['dashboard']; // 默认选中仪表板
    }
  };

  // 获取打开的SubMenu
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/reports/')) {
      return ['reports'];
    }
    return [];
  };

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={onCollapse}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div className="logo" style={{ height: '32px', margin: '16px' }}>
        {!collapsed && <Text strong style={{ marginLeft: '8px' }}>{t('sidebar.systemTitle')}</Text>}
      </div>
      <Menu 
        theme="dark" 
        defaultSelectedKeys={getSelectedKey()} 
        defaultOpenKeys={getOpenKeys()}
        mode="inline"
      >
        <Menu.Item key="dashboard" icon={<HomeOutlined />}>
          <Link to="/dashboard">{t('sidebar.dashboard')}</Link>
        </Menu.Item>
        
        <Menu.Item key="employees" icon={<TeamOutlined />}>
          <Link to="/employees">{t('sidebar.employees')}</Link>
        </Menu.Item>
        
        <Menu.Item key="departments" icon={<BuildOutlined />}>
          <Link to="/departments">{t('sidebar.departments')}</Link>
        </Menu.Item>
        
        <Menu.Item key="salary-data" icon={<DatabaseOutlined />}>
          <Link to="/salary-data">{t('sidebar.salaryData')}</Link>
        </Menu.Item>
        
        {/* 报表菜单 */}
        <SubMenu key="reports" icon={<LineChartOutlined />} title={t('sidebar.reports')}>
          {reportLinksLoading ? (
            <Menu.Item key="loading-reports" disabled>
              {t('common.loading')}
            </Menu.Item>
          ) : reportLinks.length > 0 ? (
            reportLinks.map(link => (
              <Menu.Item key={`report-${link.id}`}>
                <Link to={`/reports/${link.id}`}>{link.name}</Link>
              </Menu.Item>
            ))
          ) : (
            <Menu.Item key="no-reports" disabled>
              {t('sidebar.noReports')}
            </Menu.Item>
          )}
        </SubMenu>
        
        {/* 只对管理员显示报表链接管理 */}
        {isAdmin && (
          <Menu.Item key="report-links" icon={<SettingOutlined />}>
            <Link to="/report-links">{t('sidebar.reportLinks')}</Link>
          </Menu.Item>
        )}
        
        <Menu.Item key="files" icon={<FileOutlined />}>
          <Link to="/files">{t('sidebar.files')}</Link>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar; 