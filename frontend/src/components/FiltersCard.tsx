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
          <FilterOutlined /> Filters & Sorting
        </span>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Creator</div>
          <Select
            placeholder="All Creators"
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
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Assignee</div>
          <Select
            placeholder="All Assignees"
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
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Team</div>
          <Select
            placeholder="All Teams"
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
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Created Date Range</div>
          <RangePicker
            style={{ width: '100%' }}
            value={filters.createdDateRange}
            onChange={(dates) => onFilterChange('createdDateRange', dates)}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Sort By</div>
          <Select
            style={{ width: '100%' }}
            value={filters.sortBy}
            onChange={(value) => onFilterChange('sortBy', value)}
          >
            <Select.Option value="createdAt">Created Time</Select.Option>
            <Select.Option value="dueDate">Due Date</Select.Option>
            <Select.Option value="creator">Creator</Select.Option>
            <Select.Option value="id">Task ID</Select.Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={2}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Order</div>
          <Select
            style={{ width: '100%' }}
            value={filters.sortOrder}
            onChange={(value) => onFilterChange('sortOrder', value)}
          >
            <Select.Option value="ASC">ASC</Select.Option>
            <Select.Option value="DESC">DESC</Select.Option>
          </Select>
        </Col>
      </Row>
      <div style={{ marginTop: 12 }}>
        <Button size="small" onClick={onResetFilters}>
          Reset Filters
        </Button>
      </div>
    </Card>
  );
};

export default FiltersCard;

