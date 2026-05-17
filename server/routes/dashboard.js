const express = require('express');
const { pool } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  const userId = req.user.id;
  const statsResult = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE t.status = 'todo') AS todo_count,
       COUNT(*) FILTER (WHERE t.status = 'in_progress') AS in_progress_count,
       COUNT(*) FILTER (WHERE t.status = 'done') AS done_count,
       COUNT(*) AS total_tasks
     FROM tasks t
     INNER JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1`,
    [userId]
  );
  const overdueResult = await pool.query(
    `SELECT t.id, t.title, t.status, t.due_date, p.name AS project_name, p.id AS project_id
     FROM tasks t
     INNER JOIN projects p ON p.id = t.project_id
     INNER JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
     WHERE t.due_date < CURRENT_DATE AND t.status != 'done'
     ORDER BY t.due_date ASC
     LIMIT 20`,
    [userId]
  );
  const myTasksResult = await pool.query(
    `SELECT t.id, t.title, t.status, t.due_date, p.name AS project_name, p.id AS project_id
     FROM tasks t
     INNER JOIN projects p ON p.id = t.project_id
     INNER JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
     WHERE t.assigned_to = $1 AND t.status != 'done'
     ORDER BY t.due_date ASC NULLS LAST
     LIMIT 20`,
    [userId]
  );
  const projectsResult = await pool.query(
    `SELECT COUNT(*) AS project_count FROM project_members WHERE user_id = $1`,
    [userId]
  );
  res.json({
    stats: {
      ...statsResult.rows[0],
      project_count: parseInt(projectsResult.rows[0].project_count, 10)
    },
    overdue_tasks: overdueResult.rows,
    my_tasks: myTasksResult.rows
  });
});

module.exports = router;
