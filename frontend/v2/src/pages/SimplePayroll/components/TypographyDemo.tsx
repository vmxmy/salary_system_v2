import React from 'react';
import { Card, Row, Col, Divider, Space } from 'antd';
import '../styles.less';

/**
 * 字体样式演示组件
 * 展示极简工资页面的字体规范使用效果
 */
const TypographyDemo: React.FC = () => {
  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f8f8' }}>
      <Row gutter={[24, 24]}>
        {/* 标题样式演示 */}
        <Col span={24}>
          <Card title="标题样式 (Typography Titles)" variant="borderless">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <h1 className="typography-title-primary">主标题 - 极简工资报表系统</h1>
                <p className="typography-label-secondary">24px / Bold / #1a1a1a</p>
              </div>
              
              <div>
                <h2 className="typography-title-secondary">二级标题 - 薪资数据概览</h2>
                <p className="typography-label-secondary">20px / Semibold / #1a1a1a</p>
              </div>
              
              <div>
                <h3 className="typography-title-tertiary">三级标题 - 统计信息</h3>
                <p className="typography-label-secondary">18px / Semibold / #1a1a1a</p>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 正文样式演示 */}
        <Col span={12}>
          <Card title="正文样式 (Body Text)" variant="borderless">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <p className="typography-body-primary">
                  主要正文内容：这是用于显示重要信息的主要文字样式，具有良好的可读性和视觉层次。
                </p>
                <p className="typography-label-secondary">14px / Normal / #1a1a1a</p>
              </div>
              
              <Divider />
              
              <div>
                <p className="typography-body-secondary">
                  次要正文内容：这是用于显示辅助信息的次要文字样式，颜色相对较浅，用于描述性内容。
                </p>
                <p className="typography-label-secondary">14px / Normal / #666666</p>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 标签样式演示 */}
        <Col span={12}>
          <Card title="标签样式 (Labels)" variant="borderless">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <label className="typography-label-primary">主要标签文字</label>
                <p className="typography-label-secondary">12px / Medium / #666666</p>
              </div>
              
              <Divider />
              
              <div>
                <label className="typography-label-secondary">次要标签文字</label>
                <p className="typography-label-secondary">10px / Normal / #999999</p>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 数值样式演示 */}
        <Col span={24}>
          <Card title="数值样式 (Numbers)" variant="borderless">
            <Row gutter={[24, 24]}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div className="typography-number-large">1,234,567.89</div>
                  <p className="typography-label-secondary">大数值 - 28px / Bold</p>
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div className="typography-number-medium">123,456.78</div>
                  <p className="typography-label-secondary">中数值 - 18px / Semibold</p>
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div className="typography-number-small">12,345.67</div>
                  <p className="typography-label-secondary">小数值 - 14px / Medium</p>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 状态样式演示 */}
        <Col span={24}>
          <Card title="状态样式 (Status Colors)" variant="borderless">
            <Row gutter={[24, 24]}>
              <Col span={6}>
                <div className="typography-body-primary typography-success">
                  成功状态文字
                </div>
                <p className="typography-label-secondary">#52c41a</p>
              </Col>
              
              <Col span={6}>
                <div className="typography-body-primary typography-warning">
                  警告状态文字
                </div>
                <p className="typography-label-secondary">#faad14</p>
              </Col>
              
              <Col span={6}>
                <div className="typography-body-primary typography-error">
                  错误状态文字
                </div>
                <p className="typography-label-secondary">#ff4d4f</p>
              </Col>
              
              <Col span={6}>
                <div className="typography-body-primary typography-info">
                  信息状态文字
                </div>
                <p className="typography-label-secondary">#1890ff</p>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 链接样式演示 */}
        <Col span={24}>
          <Card title="链接样式 (Links)" variant="borderless">
            <Space size="large">
              <a href="#" className="typography-link">普通链接文字</a>
              <a href="#" className="typography-link typography-body-primary">重要链接文字</a>
              <a href="#" className="typography-link typography-label-primary">小链接文字</a>
            </Space>
            <p className="typography-label-secondary" style={{ marginTop: '12px' }}>
              链接具有悬停效果和下划线
            </p>
          </Card>
        </Col>

        {/* 实际应用示例 */}
        <Col span={24}>
          <Card title="实际应用示例 (Real Usage Example)" variant="borderless">
            <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
              <h3 className="typography-title-tertiary">薪资统计卡片</h3>
              
              <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="typography-number-medium">81</div>
                    <div className="typography-label-primary">总人数</div>
                  </div>
                </Col>
                
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="typography-number-medium typography-success">1,156,725.00</div>
                    <div className="typography-label-primary">应发合计</div>
                  </div>
                </Col>
                
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="typography-number-medium typography-warning">323,453.71</div>
                    <div className="typography-label-primary">扣发合计</div>
                  </div>
                </Col>
                
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="typography-number-medium typography-info">833,271.29</div>
                    <div className="typography-label-primary">实发合计</div>
                  </div>
                </Col>
              </Row>
              
              <Divider />
              
              <div>
                <div className="typography-label-primary" style={{ marginBottom: '8px' }}>详细信息：</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="typography-label-secondary">审核状态</span>
                  <span className="typography-label-secondary typography-error">失败</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="typography-label-secondary">异常数量</span>
                  <span className="typography-label-secondary">5 个错误</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="typography-label-secondary">最后更新</span>
                  <span className="typography-label-secondary">2025-06-07 22:35</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TypographyDemo; 