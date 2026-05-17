const jwt = require('jsonwebtoken');
const { pool } = require('../db');

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function getProjectMembership(projectId, userId) {
  const result = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows[0] || null;
}

async function requireProjectMember(req, res, next) {
  const projectId = parseInt(req.params.projectId || req.params.id, 10);
  if (Number.isNaN(projectId)) {
    return res.status(400).json({ error: 'Invalid project id' });
  }
  const membership = await getProjectMembership(projectId, req.user.id);
  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this project' });
  }
  req.projectId = projectId;
  req.projectRole = membership.role;
  next();
}

function requireProjectAdmin(req, res, next) {
  if (req.projectRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authRequired, getProjectMembership, requireProjectMember, requireProjectAdmin };
