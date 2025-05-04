import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Breadcrumb, Button, ConfigProvider, Dropdown, Space, theme as antdTheme, Avatar, App as AntApp } from 'antd';
import type { ThemeConfig } from 'antd';
import { FileExcelOutlined, UserOutlined, HomeOutlined, SettingOutlined, DatabaseOutlined, GlobalOutlined, BarChartOutlined, LogoutOutlined, UploadOutlined } from '@ant-design/icons';
import SalaryDataViewer from './components/SalaryDataViewer';
import FileConverter from './components/FileConverter';
import MappingConfigurator from './components/MappingConfigurator';
import EmployeeManager from './components/EmployeeManager';
import DepartmentManager from './components/DepartmentManager';
import MonthlySalaryReport from './components/MonthlySalaryReport';
import { useTranslation } from 'react-i18next';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import UserProfilePage from './pages/UserProfilePage';
import ReportLinkManager from './components/ReportLinkManager';
import ReportViewer from './components/ReportViewer';
import reportLinksApi from './services/reportLinksApi';
import UserManager from './components/UserManager';

const { Header, Content, Footer, Sider } = Layout;

// Define type for menu items used in Dropdown
interface MenuItem {
  key: string;
  label: React.ReactNode;
}

// --- Define Custom Theme --- START
const customTheme: ThemeConfig = {
    token: {
        colorPrimary: '#008080', // Teal
        borderRadius: 8, // Softer corners for Modern & Clean
        // To use a custom font like 'Inter' or 'Nunito Sans',
        // 1. Ensure the font is loaded in your project (e.g., via CSS import in index.css or App.tsx)
        // 2. Set the fontFamily token below:
        fontFamily: '"Inter", sans-serif', // Set modern font
        colorBorder: '#f0f0f0', // Softer borders
    },
    components: {
        Table: {
            headerBg: '#fafafa', // Neutral light grey header
            headerColor: 'rgba(0, 0, 0, 0.88)', // Default dark text
        },
        // Adjust hover states based on primary color
        // You might need to refine these further based on visual testing
        // Button: {
        //     colorPrimaryBgHover: '#006d6d', // Darker teal for button hover background
        //     colorTextLightSolid: '#ffffff', // Ensure text on primary button is white
        // },
    },
    // Algorithm can be used for dark mode, etc. Not needed for basic token overrides.
    // algorithm: antdTheme.defaultAlgorithm,
};
// --- Define Custom Theme --- END

// Component for the main layout after login
const MainLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuth();
    const [reportLinks, setReportLinks] = useState<any[]>([]);
    const [reportLinksLoading, setReportLinksLoading] = useState(false);

    // Fetch active report links on component mount
    useEffect(() => {
        const fetchReportLinks = async () => {
            setReportLinksLoading(true);
            try {
                const data = await reportLinksApi.getActiveReportLinks();
                setReportLinks(data || []);
            } catch (error) {
                console.error('Error fetching report links for menu:', error);
                // Optionally show a message to the user
            } finally {
                setReportLinksLoading(false);
            }
        };

        fetchReportLinks();
    }, []);

    // Function to handle language change
    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    // Define language dropdown menu items
    const languageMenuItems: MenuItem[] = [
        { key: 'en', label: 'English' },
        { key: 'zh', label: '中文' },
    ];

    // --- User Menu --- START
    const userMenuItems: MenuItem[] = [
        {
            key: 'profile',
            label: (
                <Link to="/profile">
                    <UserOutlined /> {t('userMenu.profile')}
                </Link>
            ),
        },
        {
            key: 'logout',
            label: (
                <Button type="text" icon={<LogoutOutlined />} onClick={logout}>
                    {t('userMenu.logout')}
                </Button>
            ),
        },
    ];
    // --- User Menu --- END

    // --- Menu Items Definition --- Reordered & Updated with dynamic reports
    const generateMenuItems = () => {
        const isAdmin = user && user.role === 'Super Admin';
        const reportLinksMenuItems = reportLinksLoading
            ? [{ key: 'loading-reports', label: t('common.loading'), disabled: true }]
            : reportLinks.length > 0
                ? reportLinks.map(link => ({
                    key: `/reports/${link.id}`,
                    label: <Link to={`/reports/${link.id}`}>{link.name}</Link>,
                }))
                : [{ key: 'no-reports', label: t('sidebar.noReports'), disabled: true }];

        const items: any[] = [
        // 1. Data Management Menu
        {
            key: '/data-management',
            icon: <DatabaseOutlined />,
            label: t('menu.dataManagement'),
            children: [
                    { key: '/viewer', label: <Link to="/viewer">{t('menu.dataViewer')}</Link> },
                    { key: '/admin/employees', label: <Link to="/admin/employees">{t('menu.employeeManagement')}</Link> },
                    { key: '/admin/departments', label: <Link to="/admin/departments">{t('menu.departmentManagement')}</Link> },
            ],
        },
            // 2. Report Viewing Menu (Dynamically populated)
        {
            key: '/reports',
            icon: <BarChartOutlined />,
                label: t('menu.reports'),
                children: reportLinksMenuItems,
        },
            // 3. Data Import Menu
        {
            key: '/data-import',
            icon: <UploadOutlined />,
            label: t('menu.dataImport'),
            children: [
                    { key: '/data-import/converter', icon: <FileExcelOutlined />, label: <Link to="/data-import/converter">{t('menu.fileConverter')}</Link> },
            ],
        },
            // 4. Configuration Menu - Now includes conditional Report Links Management
        {
            key: '/config',
            icon: <SettingOutlined />,
            label: t('menu.configuration'),
            children: [
                    { key: '/config/mappings', label: <Link to="/config/mappings">{t('menu.fieldMappings')}</Link> },
                    { key: '/config/users', label: <Link to="/config/users">{t('menu.userManager')}</Link> },
                    // Conditionally add Report Links Management as a child
                    ...(isAdmin ? [{
                        key: '/report-links',
                        // icon: <LinkOutlined />, // Optional: Use a more specific icon
                        label: <Link to="/report-links">{t('menu.reportLinksManagement')}</Link>,
                    }] : []),
            ],
        },
    ];

        return items;
    };

    const menuItems = generateMenuItems();

    // --- Breadcrumb Items Definition --- Updated
    const breadcrumbNameMap: Record<string, string> = {
        '/': t('breadcrumb.home'),
        '/viewer': t('breadcrumb.dataViewer'),
        '/data-import': t('breadcrumb.dataImport'),
        '/data-import/converter': t('breadcrumb.fileConverter'),
        '/data-management': t('breadcrumb.dataManagement'),
        '/config': t('breadcrumb.configuration'),
        '/config/mappings': t('breadcrumb.fieldMappings'),
        '/admin/employees': t('breadcrumb.employeeManagement'),
        '/admin/departments': t('breadcrumb.departmentManagement'),
        '/reports': t('breadcrumb.reports'),
        '/report-links': t('menu.reportLinksManagement'),
        '/profile': t('breadcrumb.profile'),
    };

    const pathSnippets = location.pathname.split('/').filter(i => i);
    const dynamicBreadcrumbItems = pathSnippets.reduce<Array<{ key: string; title: React.ReactNode }>>((acc, snippet, index) => {
        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        let titleText = breadcrumbNameMap[url]; // Get base text
        let isLink = index < pathSnippets.length - 1; // Determine if it should be a link

        // Special handling for dynamic report viewer breadcrumbs
        if (url.startsWith('/reports/') && pathSnippets.length > 1 && index === 1) {
            const reportId = parseInt(snippet);
            const report = reportLinks.find(link => link.id === reportId);
            titleText = report ? report.name : t('breadcrumb.viewReport'); 
            // Override: Always make the specific report title non-linkable in this structure
            isLink = false; 
        }
        
        if (titleText) {
             acc.push({
                key: url,
                title: isLink ? <Link to={url}>{titleText}</Link> : titleText,
             });
        }
        return acc;
    }, []); // Explicitly type the accumulator array

    const breadcrumbItems = [
        {
            key: 'home',
            title: <Link to="/"><HomeOutlined /> {t('breadcrumb.home')}</Link>, 
        },
        ...dynamicBreadcrumbItems,
    ];

    // Determine default selected/open keys based on current path
    const currentPath = location.pathname || '/viewer';
    const openKeys = currentPath.startsWith('/config') ? ['/config']
                     : currentPath.startsWith('/reports') || currentPath.startsWith('/report-links') ? ['/reports']
                     : currentPath.startsWith('/data-import') ? ['/data-import']
                     : currentPath.startsWith('/data-management') ||
                       currentPath.startsWith('/viewer') ||
                       currentPath.startsWith('/admin/employees') ||
                       currentPath.startsWith('/admin/departments')
                       ? ['/data-management']
                     : [];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
                <div className="logo" style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: 'white', lineHeight: '32px' }}>
                   {collapsed ? t('app.sidebarTitleCollapsed') : t('app.sidebarTitle')} 
                </div>
                 <Menu 
                    theme="dark" 
                    selectedKeys={[currentPath]} 
                    defaultOpenKeys={openKeys} 
                    mode="inline" 
                    items={menuItems} 
                 />
            </Sider>
            <Layout className="site-layout">
                <Header style={{ padding: '0 16px', background: antdTheme.useToken().token.colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <Breadcrumb items={breadcrumbItems} style={{ margin: '0' }} />
                    <Space>
                         <Dropdown menu={{ items: languageMenuItems, onClick: ({ key }) => handleLanguageChange(key) }} placement="bottomRight"> 
                            <Button type="text" icon={<GlobalOutlined />}>
                                {i18n.language === 'zh' ? '中文' : 'English'}
                            </Button>
                        </Dropdown>
                        {user && (
                             <Dropdown menu={{ items: userMenuItems }} placement="bottomRight"> 
                                <a onClick={e => e.preventDefault()} style={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                                    {user.username}
                                </a>
                             </Dropdown>
                        )}
                    </Space>
                </Header>
                <Content style={{ margin: '16px' }}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/viewer" replace />} />
                        <Route path="/viewer" element={<ProtectedRoute><SalaryDataViewer /></ProtectedRoute>} />
                        <Route path="/data-import/converter" element={<ProtectedRoute><FileConverter /></ProtectedRoute>} />
                        <Route path="/config/mappings" element={<ProtectedRoute><MappingConfigurator /></ProtectedRoute>} />
                        <Route path="/config/users" element={<ProtectedRoute><UserManager /></ProtectedRoute>} />
                        <Route path="/reports/monthly-salary" element={<ProtectedRoute><MonthlySalaryReport /></ProtectedRoute>} />
                        <Route path="/admin/employees" element={<ProtectedRoute><EmployeeManager /></ProtectedRoute>} />
                        <Route path="/admin/departments" element={<ProtectedRoute><DepartmentManager /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/report-links" element={<ProtectedRoute><ReportLinkManager /></ProtectedRoute>} />
                        <Route path="/reports/:reportId" element={<ProtectedRoute><ReportViewer /></ProtectedRoute>} />
                    </Routes>
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    {t('app.footerText', { year: new Date().getFullYear() })}
                </Footer>
            </Layout>
        </Layout>
    );
};

// Root App Component
function App() {
    // Only destructure i18n as t is not used in this scope
    const { i18n } = useTranslation(); 
    const antdLocale = i18n.language === 'zh' ? zhCN : enUS;

    return (
        <ConfigProvider locale={antdLocale} theme={customTheme}>
            <AntApp>
                <AuthProvider>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </AuthProvider>
            </AntApp>
        </ConfigProvider>
    );
}

// New component to handle routing logic inside AuthProvider context
const AppRoutes: React.FC = () => {
    const { isAuthenticated } = useAuth();
    console.log("Is Authenticated:", isAuthenticated); // Log auth state for debugging

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            />
             <Route
                 path="/"
                 element={
                     isAuthenticated ? <Navigate to="/viewer" replace /> : <Navigate to="/login" replace />
                 }
             />
        </Routes>
    );
};

export default App;
