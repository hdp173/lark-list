import React from 'react';

const FeaturesInfo: React.FC = () => {
  return (
    <div
      style={{
        marginTop: 30,
        padding: 15,
        background: '#f0f7ff',
        borderRadius: 4,
        border: '1px solid #d4e8ff',
      }}
    >
      <h4 style={{ marginTop: 0, marginBottom: 12, color: '#1890ff' }}>功能说明</h4>
      <div style={{ fontSize: 13, lineHeight: 1.8, color: '#666' }}>
        <div style={{ marginBottom: 10 }}>
          <strong>通知提醒：</strong>系统会自动提醒即将到期的任务。
        </div>
        <div>
          <strong>循环任务：</strong>可以配置任务为循环任务，自动按计划重复（每日、每周、每月）。
        </div>
      </div>
    </div>
  );
};

export default FeaturesInfo;

