const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authRequired, requireProjectMember, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  const result = await pool.query(
    `SELECT p.id, p.name, p.description, p.created_at, pm.role,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count
     FROM projects p
     INNER JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  res.json({ projects: result.rows });
});

router.post(
  '/',
  authRequired,
  [
    body('name').trim().isLength({ min: 2, max: 150 }),
    body('description').optional().trim().isLength({ max: 2000 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, description } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const projectResult = await client.query(
        'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
        [name, description || null, req.user.id]
      );
      const project = projectResult.rows[0];
      await client.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [project.id, req.user.id, 'admin']
      );
      await client.query('COMMIT');
      res.status(201).json({ project: { ...project, role: 'admin' } });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

router.get('/:id', authRequired, requireProjectMember, async (req, res) => {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.projectId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ project: { ...result.rows[0], role: req.projectRole } });
});

router.put(
  '/:id',
  authRequired,
  requireProjectMember,
  requireProjectAdmin,
  [
    body('name').optional().trim().isLength({ min: 2, max: 150 }),
    body('description').optional().trim().isLength({ max: 2000 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, description } = req.body;
    if (!name && description === undefined) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    const result = await pool.query(
      `UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description)
       WHERE id = $3 RETURNING *`,
      [name || null, description !== undefined ? description : null, req.projectId]
    );
    res.json({ project: result.rows[0] });
  }
);

router.delete('/:id', authRequired, requireProjectMember, requireProjectAdmin, async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id = $1', [req.projectId]);
  res.json({ message: 'Project deleted' });
});

router.get('/:id/members', authRequired, requireProjectMember, async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, pm.role, pm.joined_at
     FROM project_members pm
     INNER JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY pm.role DESC, u.name ASC`,
    [req.projectId]
  );
  res.json({ members: result.rows });
});

router.post(
  '/:id/members',
  authRequired,
  requireProjectMember,
  requireProjectAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['admin', 'member'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, role } = req.body;
    const userResult = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [
      email
    ]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found. They must register first.' });
    }
    const member = userResult.rows[0];
    if (member.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot add yourself' });
    }
    try {
      const insert = await pool.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
        [req.projectId, member.id, role]
      );
      res.status(201).json({
        member: { ...member, role: insert.rows[0].role, joined_at: insert.rows[0].joined_at }
      });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'User is already a member' });
      }
      throw err;
    }
  }
);

router.patch(
  '/:id/members/:userId',
  authRequired,
  requireProjectMember,
  requireProjectAdmin,
  [body('role').isIn(['admin', 'member'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const userId = parseInt(req.params.userId, 10);
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }
    const result = await pool.query(
      'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3 RETURNING *',
      [req.body.role, req.projectId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ member: result.rows[0] });
  }
);

router.delete(
  '/:id/members/:userId',
  authRequired,
  requireProjectMember,
  requireProjectAdmin,
  async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }
    const result = await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING *',
      [req.projectId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member removed' });
  }
);

module.exports = router;
