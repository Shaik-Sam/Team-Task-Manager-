import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="muted">Loading dashboard...</p>;
  }
  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const stats = data.stats;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="muted">Overview of your projects and tasks</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Projects</span>
          <span className="stat-value">{stats.project_count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">To Do</span>
          <span className="stat-value">{stats.todo_count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">In Progress</span>
          <span className="stat-value accent">{stats.in_progress_count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Done</span>
          <span className="stat-value success">{stats.done_count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Tasks</span>
          <span className="stat-value">{stats.total_tasks}</span>
        </div>
      </div>
      <div className="two-col">
        <section className="panel">
          <h2>Overdue tasks</h2>
          {data.overdue_tasks.length === 0 ? (
            <p className="muted">No overdue tasks</p>
          ) : (
            <ul className="task-list">
              {data.overdue_tasks.map((t) => (
                <li key={t.id}>
                  <Link to={`/projects/${t.project_id}`}>
                    <strong>{t.title}</strong>
                    <span className="badge badge-danger">Overdue</span>
                  </Link>
                  <span className="muted">
                    {t.project_name} · due {t.due_date}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h2>My open tasks</h2>
          {data.my_tasks.length === 0 ? (
            <p className="muted">No tasks assigned to you</p>
          ) : (
            <ul className="task-list">
              {data.my_tasks.map((t) => (
                <li key={t.id}>
                  <Link to={`/projects/${t.project_id}`}>
                    <strong>{t.title}</strong>
                    <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                  </Link>
                  <span className="muted">
                    {t.project_name}
                    {t.due_date ? ` · due ${t.due_date}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
