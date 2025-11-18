const express = require('express');
const router = express.Router();
const TodoItem = require('../models/TodoItem');
const { authenticateToken } = require('../middleware/auth');

// Helper: Generate unique ID for todo (if needed, not used with Mongo _id)
// const generateTodoId = () => {
//   return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
// };

// GET /api/todos - Fetch all todos for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const todos = await TodoItem.find({ userId });
    res.json({
      success: true,
      message: 'Todos fetched successfully',
      todos,
      totalCount: todos.length
    });
  } catch (error) {
    console.error('Fetch todos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching todos',
      error: error.message
    });
  }
});

// POST /api/todos - Add new todo
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      description = '',
      priority = 'medium',
      deadline = null,
      status = 'todo',
      position = 0,
      subtasks = [],
      tags = []
    } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    const todo = new TodoItem({
      userId,
      title: title.trim(),
      description,
      priority,
      deadline: deadline ? new Date(deadline) : null,
      status,
      position,
      subtasks,
      tags
    });

    await todo.save();

    res.status(201).json({
      success: true,
      message: 'Todo added successfully',
      todo
    });

  } catch (error) {
    console.error('Add todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding todo',
      error: error.message
    });
  }
});

// PUT /api/todos/:todoId - Update todo
router.put('/:todoId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { todoId } = req.params;
    const updateFields = {};
    const allowedFields = ['title', 'description', 'status', 'priority', 'deadline', 'position', 'subtasks', 'tags'];

    // Only update allowed fields if present
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateFields[key] = req.body[key];
      }
    }

    // If title is updated, validate it's not empty
    if (updateFields.title && updateFields.title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Task title cannot be empty' });
    }

    // Update and return the new doc
    const todo = await TodoItem.findOneAndUpdate(
      { _id: todoId, userId },
      updateFields,
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    res.json({
      success: true,
      message: 'Todo updated successfully',
      todo
    });

  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating todo',
      error: error.message
    });
  }
});

// DELETE /api/todos/:todoId - Delete todo
router.delete('/:todoId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { todoId } = req.params;

    const todo = await TodoItem.findOneAndDelete({ _id: todoId, userId });

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    res.json({
      success: true,
      message: 'Todo deleted successfully',
      todo
    });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting todo',
      error: error.message
    });
  }
});

// GET /api/todos/stats - Get todo statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const todos = await TodoItem.find({ userId });
    const stats = {
      total: todos.length,
      todo: todos.filter(item => item.status === 'todo').length,
      doing: todos.filter(item => item.status === 'doing').length,
      done: todos.filter(item => item.status === 'done').length
    };
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Todo stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stats',
      error: error.message
    });
  }
});

module.exports = router;
