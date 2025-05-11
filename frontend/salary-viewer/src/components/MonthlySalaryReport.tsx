import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Select, Alert, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api'; // Assuming apiClient is configured

const MonthlySalaryReport: React.FC = () => {
    const { t } = useTranslation();
    // Update the base URL for JimuReport
    const baseJimuReportUrl = 'http://localhost:8085/jmreport/shareView/1073447373640241152?shareToken=3e14f7055ac0838c59f7b56a4e8e90cb';

    // REMOVE hardcoded data
    // const hardcodedPeriods = useMemo(() => ['2025-01', '2024-04'], []); 
    const [availablePeriods, setAvailablePeriods] = useState<string[]>([]); // Initialize as empty
    const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null); // Initialize as null
    const [loadingPeriods, setLoadingPeriods] = useState<boolean>(true); // Start loading initially
    const [fetchError, setFetchError] = useState<string | null>(null); // Start with no error

    // UNCOMMENT the API fetching useEffect
    useEffect(() => {
        const fetchPayPeriods = async () => {
            setLoadingPeriods(true);
            setFetchError(null);
            try {
                const response = await apiClient.get<{ data: string[] }>('/api/salary_data/pay_periods');
                if (response.data && Array.isArray(response.data.data)) {
                    // Sort periods descending (most recent first)
                    const sortedPeriods = response.data.data.sort().reverse(); 
                    setAvailablePeriods(sortedPeriods);
                    // Automatically select the most recent period if none is selected yet
                    if (sortedPeriods.length > 0 && !selectedPeriod) {
                        setSelectedPeriod(sortedPeriods[0]);
                    }
                } else {
                    console.error('Invalid data format received for pay periods:', response.data);
                    setFetchError(t('reports.errors.invalidPayPeriodFormat')); // Use translation
                }
            } catch (error: any) {
                console.error("Failed to fetch pay periods:", error);
                const errorDetail = error.response?.data?.detail || error.message || 'Unknown error';
                setFetchError(t('reports.errors.fetchPayPeriodsFailed', { error: errorDetail })); // Use translation
            } finally {
                setLoadingPeriods(false);
            }
        };

        fetchPayPeriods();
    // Adjust dependency array: Run once on mount, and potentially if base URL changes (though unlikely)
    // Remove selectedPeriod as dependency to avoid re-fetching when user selects a period
    }, [t, baseJimuReportUrl]); // Run once on mount

    // Calculate iframe src dynamically based on selected period
    const iframeSrc = useMemo(() => {
        if (!selectedPeriod) {
            return undefined; // Or a default URL / empty page?
        }
        // IMPORTANT: Use the correct parameter name for JimuReport
        const params = new URLSearchParams();
        params.set('pay_period', selectedPeriod); // Changed parameter name to pay_period
        
        // Append the parameter to the base URL
        // Assuming JimuReport appends parameters like standard URLs
        return `${baseJimuReportUrl}&${params.toString()}`;

    }, [selectedPeriod, baseJimuReportUrl]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}> {/* Adjust height for controls */}
            <Space align="center" style={{ marginBottom: '16px' }}> {/* Added marginBottom */}
                <label htmlFor="payPeriodSelect">{t('reports.selectPayPeriodLabel')}</label>
                <Select
                    id="payPeriodSelect"
                    style={{ minWidth: 150 }}
                    value={selectedPeriod}
                    onChange={(value) => setSelectedPeriod(value)}
                    loading={loadingPeriods}
                    disabled={loadingPeriods || !!fetchError}
                    placeholder={t('reports.selectPayPeriodPlaceholder')}
                    options={availablePeriods.map(period => ({ label: period, value: period }))}
                />
                {loadingPeriods && <Spin size="small" />} 
            </Space>

            {fetchError && (
                <Alert message={t('common.error')} description={fetchError} type="error" showIcon style={{ marginBottom: 16 }}/>
            )}

            <div style={{ flexGrow: 1 }}> {/* Added border for iframe container */}
                {iframeSrc ? (
                    <iframe
                        src={iframeSrc}
                        title={t('menu.monthlySalaryReport')} 
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                        }}
                        // JimuReport might require different sandbox permissions or none
                        // allowFullScreen 
                    />
                ) : (
                    <div style={{ padding: '20px' }}>
                        { !loadingPeriods && !fetchError && t('reports.selectPayPeriodPlaceholder')}
                        {/* Show placeholder text if no period is selected and not loading/error */} 
                    </div>
                )}
            </div>
        </div>
    );
};

export default MonthlySalaryReport; 