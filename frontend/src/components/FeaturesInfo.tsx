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
      <h4 style={{ marginTop: 0, marginBottom: 12, color: '#1890ff' }}>Features</h4>
      <div style={{ fontSize: 13, lineHeight: 1.8, color: '#666' }}>
        <div style={{ marginBottom: 10 }}>
          <strong>Notification Reminders:</strong> You will receive automatic notification
          reminders for tasks that are nearing their due date.
        </div>
        <div>
          <strong>Scheduled Recurring Tasks:</strong> Tasks can be configured as recurring tasks
          that automatically repeat on a scheduled basis (daily, weekly, monthly).
        </div>
      </div>
    </div>
  );
};

export default FeaturesInfo;

