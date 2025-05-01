import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Alert, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import reportLinksApi from '../services/reportLinksApi';

const ReportViewer: React.FC = () => {
  const { t } = useTranslation();
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportLink, setReportLink] = useState<any>(null);

  useEffect(() => {
    const fetchReportLink = async () => {
      if (!reportId) {
        setError(t('reportViewer.noReportIdError'));
        setLoading(false);
        return;
      }

      try {
        const data = await reportLinksApi.getReportLink(parseInt(reportId));
        setReportLink(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching report link:', err);
        setError(t('reportViewer.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchReportLink();
  }, [reportId, t]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <Spin size="large" tip={t('common.loading')} />;
  }

  if (error || !reportLink) {
    return (
      <div>
        <Alert type="error" message={error || t('reportViewer.reportNotFound')} />
        <Button 
          type="primary" 
          onClick={handleBack} 
          icon={<ArrowLeftOutlined />}
          style={{ marginTop: 16 }}
        >
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      <Space align="center" style={{ marginBottom: '16px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
        >
          {t('common.back')}
        </Button>
        <h2>{reportLink.name}</h2>
      </Space>

      <div style={{ flexGrow: 1, border: '1px solid #d9d9d9' }}>
        <iframe
          src={reportLink.url}
          title={reportLink.name}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>
    </div>
  );
};

export default ReportViewer; 