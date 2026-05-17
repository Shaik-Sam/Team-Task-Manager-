const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authRequired, requireProjectMember, getProjectMembership } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get('/', authRequired, requireProjectMember, async (req, res) => {
  const result = await pool.query(
    `SELECT t.*, u.name AS assignee_name, c.name AS creator_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     LEFT JOIN users c ON c.id = t.created_by
     WHERE t.project_id = $1
     ORDER BY t.created_at DESC`,
    [req.projectId]
  );
  res.json({ tasks: result.rows });
});

router.post(
  '/',
  authRequired,
  requireProjectMember,
  [
    body('title').trim().isLength({ min: 2, max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('assigned_to').optional().isInt({ min: 1 }),
    body('due_date').optional().isISO8601().toDate()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, description, status, assigned_to, due_date } = req.body;
    if (assigned_to) {
      const memberCheck = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [req.projectId, assigned_to]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }
    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, assigned_to, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.projectId,
        title,
        description || null,
        status || 'todo',
        assigned_to || null,
        due_date || null,
        req.user.id
      ]
    );
    res.status(201).json({ task: result.rows[0] });
  }
);

router.get('/:taskId', authRequired, async (req, res) => {
  const taskId = parseInt(req.params.taskId, 10);
  const result = await pool.query(
    `SELECT t.*, u.name AS assignee_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.id = $1`,
    [taskId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const task = result.rows[0];
  const membership = await getProjectMembership(task.project_id, req.user.id);
  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this project' });
  }
  res.json({ task });
});

router.put(
  '/:taskId',
  authRequired,
  [
    body('title').optional().trim().isLength({ min: 2, max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('assigned_to').optional({ nullable: true }).isInt({ min: 1 }),
    body('due_date').optional({ nullable: true }).isISO8601().toDate()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const taskId = parseInt(req.params.taskId, 10);
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = existing.rows[0];
    const membership = await getProjectMembership(task.project_id, req.user.id);
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this project' });
    }
    if (membership.role === 'member' && task.assigned_to !== req.user.id && task.created_by !== req.user.id) {
      const onlyStatus = Object.keys(req.body).every((k) => k === 'status' || req.body[k] === undefined);
      if (!onlyStatus) {
        return res.status(403).json({ error: 'Members can only edit tasks they created or are assigned to' });
      }
    }
    const { title, description, status, assigned_to, due_date } = req.body;
    if (assigned_to !== undefined && assigned_to !== null) {
      const memberCheck = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [task.project_id, assigned_to]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }
    const nextTitle = title !== undefined ? title : task.title;
    const nextDescription = description !== undefined ? description : task.description;
    const nextStatus = status !== undefined ? status : task.status;
    const nextAssigned =
      assigned_to !== undefined ? assigned_to : task.assigned_to;
    const nextDue = due_date !== undefined ? due_date : task.due_date;
    const result = await pool.query(
      `UPDATE tasks SET title = $1, description = $2, status = $3, assigned_to = $4, due_date = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [nextTitle, nextDescription, nextStatus, nextAssigned, nextDue, taskId]
    );
    res.json({ task: result.rows[0] });
  }
);

router.delete('/:taskId', authRequired, async (req, res) => {
  const taskId = parseInt(req.params.taskId, 10);
  const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const task = existing.rows[0];
  const membership = await getProjectMembership(task.project_id, req.user.id);
  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this project' });
  }
  if (membership.role !== 'admin' && task.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Only admin or task creator can delete' });
  }
  await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
