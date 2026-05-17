import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const STATUSES = ['todo', 'in_progress', 'done'];

function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, m, t] = await Promise.all([
        api.getProject(id),
        api.getMembers(id),
        api.getTasks(id)
      ]);
      setProject(p.project);
      setMembers(m.members);
      setTasks(t.tasks);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = project?.role === 'admin';

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.addMember(id, { email: memberEmail, role: memberRole });
      setMemberEmail('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.createTask(id, {
        title: taskTitle,
        description: taskDesc,
        due_date: taskDue || undefined,
        assigned_to: taskAssignee ? parseInt(taskAssignee, 10) : undefined
      });
      setTaskTitle('');
      setTaskDesc('');
      setTaskDue('');
      setTaskAssignee('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.updateTask(id, taskId, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.deleteTask(id, taskId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.removeMember(id, userId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!project) {
    return <p className="muted">Loading project...</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>{project.name}</h1>
        <p className="muted">{project.description || 'No description'}</p>
        <span className={`badge badge-role-${project.role}`}>You are {project.role}</span>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="two-col">
        <section className="panel">
          <h2>Team members</h2>
          <ul className="member-list">
            {members.map((m) => (
              <li key={m.id}>
                <div>
                  <strong>{m.name}</strong>
                  <span className="muted"> {m.email}</span>
                </div>
                <div className="member-actions">
                  <span className={`badge badge-role-${m.role}`}>{m.role}</span>
                  {isAdmin && m.id !== user?.id && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRemoveMember(m.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {isAdmin && (
            <form className="form-stack" onSubmit={handleAddMember}>
              <input
                type="email"
                placeholder="Member email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
              />
              <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="btn btn-primary">
                Add member
              </button>
            </form>
          )}
        </section>
        <section className="panel">
          <h2>Tasks</h2>
          <form className="form-stack" onSubmit={handleCreateTask}>
            <input
              placeholder="Task title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              minLength={2}
            />
            <textarea
              placeholder="Description"
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              rows={2}
            />
            <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
            <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary">
              Add task
            </button>
          </form>
          <div className="task-table">
            {tasks.length === 0 ? (
              <p className="muted">No tasks yet</p>
            ) : (
              tasks.map((t) => (
                <div key={t.id} className="task-row">
                  <div>
                    <strong>{t.title}</strong>
                    {t.description && <p className="muted">{t.description}</p>}
                    <span className="muted">
                      {t.assignee_name ? `Assigned: ${t.assignee_name}` : 'Unassigned'}
                      {t.due_date ? ` · Due ${t.due_date}` : ''}
                    </span>
                  </div>
                  <div className="task-row-actions">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteTask(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProjectDetail;
