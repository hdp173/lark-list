// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Layout, message, Modal, Form } from 'antd';
import { useNavigate } from 'react-router-dom';
import { taskApi, userApi, teamApi } from '../api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Header from '../components/Header';
import FiltersCard from '../components/FiltersCard';
import TaskTable from '../components/TaskTable';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import CreateTaskModal from '../components/CreateTaskModal';
import CreateSubtaskModal from '../components/CreateSubtaskModal';
import CreateTeamModal from '../components/CreateTeamModal';
import FeaturesInfo from '../components/FeaturesInfo';
import { TaskStatus } from '../types';
import { Task, User, Team, FilterState } from '../components/types';

dayjs.extend(relativeTime);

const { Content } = Layout;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [savedDescription, setSavedDescription] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateSubtaskModalOpen, setIsCreateSubtaskModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [subtaskForm] = Form.useForm();

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    creatorId: undefined,
    assigneeId: undefined,
    teamId: undefined,
    createdDateRange: undefined,
    sortBy: 'createdAt',
    sortOrder: 'ASC',
  });

  // Teams state
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [teamForm] = Form.useForm();

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchTeams();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await userApi.getAll();
      setUsers(res.data);

      // Set current user from localStorage username
      const username = localStorage.getItem('username');
      if (username) {
        const user = res.data.find((u: User) => u.username === username);
        if (user) {
          setCurrentUser(user);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await teamApi.getAll();
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async (queryParams?: FilterState) => {
    setLoading(true);
    try {
      const params = queryParams || filters;
      const apiParams: any = {
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      };

      if (params.creatorId) apiParams.creatorId = params.creatorId;
      if (params.assigneeId) apiParams.assigneeId = params.assigneeId;
      if (params.teamId) apiParams.teamId = params.teamId;

      if (params.createdDateRange && params.createdDateRange.length === 2) {
        apiParams.createdAfter = params.createdDateRange[0].startOf('day').toISOString();
        apiParams.createdBefore = params.createdDateRange[1].endOf('day').toISOString();
      }

      const res = await taskApi.getAll(apiParams);
      setTasks(buildTree(res.data));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const buildTree = (items: any[]) => {
    const map: any = {};
    const roots: any[] = [];
    items.forEach((item) => {
      map[item.id] = { ...item, key: item.id, children: [] };
    });
    items.forEach((item) => {
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });
    return roots;
  };

  const handleCreateTask = async (values: any) => {
    try {
      // Clean up empty string values for UUID fields
      const cleanedValues = {
        ...values,
        dueDate: values.dueDate?.toISOString(),
        parentId: values.parentId || undefined,
        assigneeIds:
          values.assigneeIds && values.assigneeIds.length > 0 ? values.assigneeIds : undefined,
        followerIds:
          values.followerIds && values.followerIds.length > 0 ? values.followerIds : undefined,
        teamIds:
          values.teamIds && values.teamIds.length > 0 ? values.teamIds : undefined,
      };
      await taskApi.create(cleanedValues);
      message.success('Task created');
      setIsCreateModalOpen(false);
      form.resetFields();
      fetchTasks();
    } catch (e) {
      message.error('任务创建失败');
    }
  };

  const handleCreateSubtask = async (values: any) => {
    if (!currentTask) return;
    try {
      const cleanedValues = {
        ...values,
        parentId: currentTask.id,
        dueDate: values.dueDate?.toISOString(),
        assigneeIds:
          values.assigneeIds && values.assigneeIds.length > 0 ? values.assigneeIds : undefined,
        followerIds:
          values.followerIds && values.followerIds.length > 0 ? values.followerIds : undefined,
        teamIds:
          values.teamIds && values.teamIds.length > 0 ? values.teamIds : undefined,
      };
      await taskApi.create(cleanedValues);
      message.success('Subtask created');
      setIsCreateSubtaskModalOpen(false);
      subtaskForm.resetFields();
      fetchTasks();
      // Refresh history to show subtask creation log
      if (currentTask) {
        const res = await taskApi.getHistory(currentTask.id);
        setHistory(res.data);
      }
    } catch (e) {
      message.error('Failed to create subtask');
    }
  };

  const handleStatusChange = async (task: Task, newStatus?: TaskStatus) => {
    // If newStatus is provided (from dropdown), use it; otherwise toggle (for backward compatibility)
    const statusToSet = newStatus || (task.status === TaskStatus.TODO ? TaskStatus.DONE : TaskStatus.TODO);
    
    if (task.status === statusToSet) return; // No change needed
    
    try {
      await taskApi.update(task.id, { status: statusToSet });
      message.success('Status updated');
      
      // Update current task if it's the same task
      if (currentTask && currentTask.id === task.id) {
        setCurrentTask({ ...currentTask, status: statusToSet });
      }
      
      fetchTasks();
    } catch (e) {
      message.error('Failed to update status');
    }
  };

  const handleStatusChangeInDetail = async (newStatus: TaskStatus) => {
    if (!currentTask) return;
    try {
      await taskApi.update(currentTask.id, { status: newStatus });
      message.success('Status updated');
      setCurrentTask({ ...currentTask, status: newStatus });
      fetchTasks();
      // Refresh history to show the status change log
      const res = await taskApi.getHistory(currentTask.id);
      setHistory(res.data);
    } catch (e) {
      message.error('Failed to update status');
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    if (!currentTask) return;
    if (newTitle.trim() === '') {
      message.error('标题不能为空');
      return;
    }
    if (newTitle === currentTask.title) return; // No change

    try {
      await taskApi.update(currentTask.id, { title: newTitle.trim() });
      message.success('Title updated');
      setCurrentTask({ ...currentTask, title: newTitle.trim() });
      fetchTasks();
      // Refresh history to show the title change log
      const res = await taskApi.getHistory(currentTask.id);
      setHistory(res.data);
    } catch (e) {
      message.error('Failed to update title');
    }
  };

  const handleDescriptionChange = async (newDescription: string) => {
    if (!currentTask) return;
    const trimmedDesc = newDescription.trim();
    // Compare against the saved description, not the current state
    if (trimmedDesc === (savedDescription || '')) return; // No change

    try {
      await taskApi.update(currentTask.id, { description: trimmedDesc || null });
      message.success('Description updated');
      const updatedDescription = trimmedDesc || undefined;
      setCurrentTask({ ...currentTask, description: updatedDescription });
      setSavedDescription(updatedDescription); // Update saved description after successful save
      fetchTasks();
      // Refresh history to show the description change log
      const res = await taskApi.getHistory(currentTask.id);
      setHistory(res.data);
    } catch (e) {
      message.error('Failed to update description');
      // Revert to saved description on error
      setCurrentTask({ ...currentTask, description: savedDescription });
    }
  };

  const openDetail = async (record: Task) => {
    setCurrentTask(record);
    setSavedDescription(record.description); // Store the original saved description
    setDrawerVisible(true);
    try {
      const res = await taskApi.getHistory(record.id);
      setHistory(res.data);
    } catch (e) {}
  };

  const handleAddComment = async (values: any) => {
    if (!currentTask) return;
    await taskApi.addComment(currentTask.id, values.content);
    const res = await taskApi.getHistory(currentTask.id);
    setHistory(res.data);
    message.success('Comment added');
  };

  const handleCreateTeam = async (values: any) => {
    try {
      const cleanedValues = {
        ...values,
        memberIds: values.memberIds && values.memberIds.length > 0 ? values.memberIds : undefined,
      };
      await teamApi.create(cleanedValues);
      message.success('Team created');
      setIsCreateTeamModalOpen(false);
      teamForm.resetFields();
      fetchTeams();
    } catch (e) {
      message.error('团队创建失败');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await taskApi.delete(taskId);
          message.success('Task deleted successfully');
          setDrawerVisible(false);
          fetchTasks();
        } catch (e: any) {
          const errorMsg =
            e?.response?.data?.message ||
            'Failed to delete task. Only the creator can delete tasks.';
          message.error(errorMsg);
          console.error('Delete error:', e);
        }
      },
    });
  };

  const handleAddFollower = async (taskId: string, userId: string) => {
    if (!currentTask || currentTask.id !== taskId) return;
    
    try {
      await taskApi.addFollower(taskId, userId);
      message.success('Follower added');
      
      // Fetch all tasks to get the updated task with all relations
      const res = await taskApi.getAll();
      const allTasks = res.data;
      const updatedTask = allTasks.find((t: Task) => t.id === taskId);
      
      // Update current task with the latest data including relations
      if (updatedTask) {
        setCurrentTask({
          ...updatedTask,
          assignees: updatedTask.assignees || [],
          followers: updatedTask.followers || [],
          teams: updatedTask.teams || [],
        });
        
        // Refresh history to show the follower change log
        const historyRes = await taskApi.getHistory(taskId);
        setHistory(historyRes.data);
      }
      
      // Refresh the task list
      await fetchTasks();
    } catch (e) {
      message.error('Failed to add follower');
    }
  };

  const handleRemoveFollower = async (taskId: string, userId: string) => {
    if (!currentTask || currentTask.id !== taskId) return;
    
    try {
      await taskApi.removeFollower(taskId, userId);
      message.success('Follower removed');
      
      // Fetch all tasks to get the updated task with all relations
      const res = await taskApi.getAll();
      const allTasks = res.data;
      const updatedTask = allTasks.find((t: Task) => t.id === taskId);
      
      // Update current task with the latest data including relations
      if (updatedTask) {
        setCurrentTask({
          ...updatedTask,
          assignees: updatedTask.assignees || [],
          followers: updatedTask.followers || [],
          teams: updatedTask.teams || [],
        });
        
        // Refresh history to show the follower change log
        const historyRes = await taskApi.getHistory(taskId);
        setHistory(historyRes.data);
      }
      
      // Refresh the task list
      await fetchTasks();
    } catch (e) {
      message.error('Failed to remove follower');
    }
  };

  const handleAddAssignee = async (taskId: string, userId: string, addToFollowers: boolean) => {
    if (!currentTask || currentTask.id !== taskId) return;
    
    try {
      await taskApi.addAssignee(taskId, userId, addToFollowers);
      message.success('Assignee added');
      
      // Fetch all tasks to get the updated task with all relations
      const res = await taskApi.getAll();
      const allTasks = res.data;
      const updatedTask = allTasks.find((t: Task) => t.id === taskId);
      
      // Update current task with the latest data including relations
      if (updatedTask) {
        setCurrentTask({
          ...updatedTask,
          assignees: updatedTask.assignees || [],
          followers: updatedTask.followers || [],
          teams: updatedTask.teams || [],
        });
        
        // Refresh history to show the assignee change log
        const historyRes = await taskApi.getHistory(taskId);
        setHistory(historyRes.data);
      }
      
      // Refresh the task list
      await fetchTasks();
    } catch (e) {
      message.error('Failed to add assignee');
    }
  };

  const handleRemoveAssignee = async (taskId: string, userId: string) => {
    if (!currentTask || currentTask.id !== taskId) return;
    
    try {
      await taskApi.removeAssignee(taskId, userId);
      message.success('Assignee removed');
      
      // Fetch all tasks to get the updated task with all relations
      const res = await taskApi.getAll();
      const allTasks = res.data;
      const updatedTask = allTasks.find((t: Task) => t.id === taskId);
      
      // Update current task with the latest data including relations
      if (updatedTask) {
        setCurrentTask({
          ...updatedTask,
          assignees: updatedTask.assignees || [],
          followers: updatedTask.followers || [],
          teams: updatedTask.teams || [],
        });
        
        // Refresh history to show the assignee change log
        const historyRes = await taskApi.getHistory(taskId);
        setHistory(historyRes.data);
      }
      
      // Refresh the task list
      await fetchTasks();
    } catch (e) {
      message.error('Failed to remove assignee');
    }
  };

  const handleAddTeam = async (taskId: string, teamId: string) => {
    if (!currentTask || currentTask.id !== taskId) return;
    
    try {
      await taskApi.addTeam(taskId, teamId);
      message.success('Team added');
      
      // Fetch all tasks to get the updated task with all relations
      const res = await taskApi.getAll();
      const allTasks = res.data;
      const updatedTask = allTasks.find((t: Task) => t.id === taskId);
      
      // Update current task with the latest data including relations
      if (updatedTask) {
        setCurrentTask({
          ...updatedTask,
          assignees: updatedTask.assignees || [],
          followers: updatedTask.followers || [],
          teams: updatedTask.teams || [],
        });
        
        // Refresh history to show the team change log
        const historyRes = await taskApi.getHistory(taskId);
        setHistory(historyRes.data);
      }
      
      // Refresh the task list
      await fetchTasks();
    } catch (e) {
      message.error('Failed to add team');
    }
  };

  const handleRemoveTeam = async (taskId: string, teamId: string) => {
    if (!currentTask || currentTask.id !== taskId) return;
    
    try {
      await taskApi.removeTeam(taskId, teamId);
      message.success('Team removed');
      
      // Fetch all tasks to get the updated task with all relations
      const res = await taskApi.getAll();
      const allTasks = res.data;
      const updatedTask = allTasks.find((t: Task) => t.id === taskId);
      
      // Update current task with the latest data including relations
      if (updatedTask) {
        setCurrentTask({
          ...updatedTask,
          assignees: updatedTask.assignees || [],
          followers: updatedTask.followers || [],
          teams: updatedTask.teams || [],
        });
        
        // Refresh history to show the team change log
        const historyRes = await taskApi.getHistory(taskId);
        setHistory(historyRes.data);
      }
      
      // Refresh the task list
      await fetchTasks();
    } catch (e) {
      message.error('Failed to remove team');
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchTasks(newFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters: FilterState = {
      creatorId: undefined,
      assigneeId: undefined,
      teamId: undefined,
      createdDateRange: undefined,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };
    setFilters(defaultFilters);
    fetchTasks(defaultFilters);
  };

  // Handler for updating assignees from table
  const handleAssigneesChangeInTable = async (taskId: string, newAssigneeIds: string[]) => {
    try {
      // Get current task to compare
      const res = await taskApi.getAll();
      const allTasks = res.data;
      const task = allTasks.find((t: Task) => t.id === taskId);
      
      if (!task) return;

      const currentAssigneeIds = (task.assignees || []).map((a) => a.id);
      
      // Find assignees to add and remove
      const toAdd = newAssigneeIds.filter((id) => !currentAssigneeIds.includes(id));
      const toRemove = currentAssigneeIds.filter((id) => !newAssigneeIds.includes(id));

      // Add new assignees
      for (const userId of toAdd) {
        await taskApi.addAssignee(taskId, userId, false);
      }

      // Remove assignees
      for (const userId of toRemove) {
        await taskApi.removeAssignee(taskId, userId);
      }

      message.success('Assignees updated');
      
      // Refresh tasks
      await fetchTasks();
      
      // Update current task if it's open
      if (currentTask && currentTask.id === taskId) {
        const updatedRes = await taskApi.getAll();
        const updatedTasks = updatedRes.data;
        const updatedTask = updatedTasks.find((t: Task) => t.id === taskId);
        if (updatedTask) {
          setCurrentTask({
            ...updatedTask,
            assignees: updatedTask.assignees || [],
            followers: updatedTask.followers || [],
            teams: updatedTask.teams || [],
          });
          const historyRes = await taskApi.getHistory(taskId);
          setHistory(historyRes.data);
        }
      }
    } catch (e) {
      message.error('Failed to update assignees');
    }
  };

  // Handler for updating followers from table
  const handleFollowersChangeInTable = async (taskId: string, newFollowerIds: string[]) => {
    try {
      // Get current task to compare
      const res = await taskApi.getAll();
      const allTasks = res.data;
      const task = allTasks.find((t: Task) => t.id === taskId);
      
      if (!task) return;

      const currentFollowerIds = (task.followers || []).map((f) => f.id);
      
      // Find followers to add and remove
      const toAdd = newFollowerIds.filter((id) => !currentFollowerIds.includes(id));
      const toRemove = currentFollowerIds.filter((id) => !newFollowerIds.includes(id));

      // Add new followers
      for (const userId of toAdd) {
        await taskApi.addFollower(taskId, userId);
      }

      // Remove followers
      for (const userId of toRemove) {
        await taskApi.removeFollower(taskId, userId);
      }

      message.success('Followers updated');
      
      // Refresh tasks
      await fetchTasks();
      
      // Update current task if it's open
      if (currentTask && currentTask.id === taskId) {
        const updatedRes = await taskApi.getAll();
        const updatedTasks = updatedRes.data;
        const updatedTask = updatedTasks.find((t: Task) => t.id === taskId);
        if (updatedTask) {
          setCurrentTask({
            ...updatedTask,
            assignees: updatedTask.assignees || [],
            followers: updatedTask.followers || [],
            teams: updatedTask.teams || [],
          });
          const historyRes = await taskApi.getHistory(taskId);
          setHistory(historyRes.data);
        }
      }
    } catch (e) {
      message.error('Failed to update followers');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        currentUser={currentUser}
        onNewTask={() => setIsCreateModalOpen(true)}
        onNewTeam={() => setIsCreateTeamModalOpen(true)}
        onLogout={handleLogout}
      />
      <Content style={{ padding: '20px' }}>
        <FiltersCard
          filters={filters}
          users={users}
          teams={teams}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        <TaskTable
          tasks={tasks}
          users={users}
          loading={loading}
          onTaskClick={openDetail}
          onStatusChange={handleStatusChange}
          onAssigneesChange={handleAssigneesChangeInTable}
          onFollowersChange={handleFollowersChangeInTable}
        />

        <FeaturesInfo />
      </Content>

      <TaskDetailDrawer
        visible={drawerVisible}
        task={currentTask}
        users={users}
        teams={teams}
        history={history}
        onClose={() => setDrawerVisible(false)}
        onTitleChange={handleTitleChange}
        onDescriptionChange={handleDescriptionChange}
        onStatusChange={handleStatusChangeInDetail}
        onDelete={handleDeleteTask}
        onAddAssignee={handleAddAssignee}
        onRemoveAssignee={handleRemoveAssignee}
        onAddFollower={handleAddFollower}
        onRemoveFollower={handleRemoveFollower}
        onAddTeam={handleAddTeam}
        onRemoveTeam={handleRemoveTeam}
        onAddComment={handleAddComment}
        onCreateSubtask={() => setIsCreateSubtaskModalOpen(true)}
      />

      <CreateTaskModal
        visible={isCreateModalOpen}
        users={users}
        teams={teams}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
        }}
        onSubmit={handleCreateTask}
        form={form}
      />

      <CreateSubtaskModal
        visible={isCreateSubtaskModalOpen}
        parentTask={currentTask}
        users={users}
        teams={teams}
        onCancel={() => {
          setIsCreateSubtaskModalOpen(false);
          subtaskForm.resetFields();
        }}
        onSubmit={handleCreateSubtask}
        form={subtaskForm}
      />

      <CreateTeamModal
        visible={isCreateTeamModalOpen}
        users={users}
        onCancel={() => {
          setIsCreateTeamModalOpen(false);
          teamForm.resetFields();
        }}
        onSubmit={handleCreateTeam}
        form={teamForm}
      />
    </Layout>
  );
};

export default Dashboard;

