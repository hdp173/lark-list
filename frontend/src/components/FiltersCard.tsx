import React from 'react';
import { Card, Select, DatePicker, Button, Row, Col } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { FilterState, User, Team } from './types';

const { RangePicker } = DatePicker;

interface FiltersCardProps {
  filters: FilterState;
  users: User[];
  teams: Team[];
  onFilterChange: (key: string, value: any) => void;
  onResetFilters: () => void;
}

const FiltersCard: React.FC<FiltersCardProps> = ({
  filters,
  users,
  teams,
  onFilterChange,
  onResetFilters,
}) => {
  return (
    <Card
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <span>
          <FilterOutlined /> 筛选与排序
        </span>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>创建者</div>
          <Select
            placeholder="所有创建者"
            allowClear
            style={{ width: '100%' }}
            value={filters.creatorId}
            onChange={(value) => onFilterChange('creatorId', value)}
          >
            {users.map((user) => (
              <Select.Option key={user.id} value={user.id}>
                {user.username}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>执行者</div>
          <Select
            placeholder="所有执行者"
            allowClear
            style={{ width: '100%' }}
            value={filters.assigneeId}
            onChange={(value) => onFilterChange('assigneeId', value)}
          >
            {users.map((user) => (
              <Select.Option key={user.id} value={user.id}>
                {user.username}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>团队</div>
          <Select
            placeholder="所有团队"
            allowClear
            style={{ width: '100%' }}
            value={filters.teamId}
            onChange={(value) => onFilterChange('teamId', value)}
          >
            {teams.map((team) => (
              <Select.Option key={team.id} value={team.id}>
                {team.name}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>创建日期范围</div>
          <RangePicker
            style={{ width: '100%' }}
            value={filters.createdDateRange}
            onChange={(dates) => onFilterChange('createdDateRange', dates)}
            placeholder={['开始日期', '结束日期']}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>排序依据</div>
          <Select
            style={{ width: '100%' }}
            value={filters.sortBy}
            onChange={(value) => onFilterChange('sortBy', value)}
          >
            <Select.Option value="createdAt">创建时间</Select.Option>
            <Select.Option value="dueDate">截止日期</Select.Option>
            <Select.Option value="creator">创建者</Select.Option>
            <Select.Option value="id">任务ID</Select.Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={2}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>顺序</div>
          <Select
            style={{ width: '100%' }}
            value={filters.sortOrder}
            onChange={(value) => onFilterChange('sortOrder', value)}
          >
            <Select.Option value="ASC">升序</Select.Option>
            <Select.Option value="DESC">降序</Select.Option>
          </Select>
        </Col>
      </Row>
      <div style={{ marginTop: 12 }}>
        <Button size="small" onClick={onResetFilters}>
          重置筛选
        </Button>
      </div>
    </Card>
  );
};

export default FiltersCard;

