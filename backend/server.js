import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'todos.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Helper to read database
async function readDB() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
      return [];
    }
    throw error;
  }
}

// Helper to write database
async function writeDB(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to sort priority
const PRIORITY_MAP = { high: 3, medium: 2, low: 1 };

// API Routes
// 1. Get all todos (with filtering, search, and sorting)
app.get('/api/todos', async (req, res) => {
  try {
    let todos = await readDB();
    const { q, category, priority, status, sortBy, order = 'asc' } = req.query;

    // Search query matching title, description, or notes
    if (q) {
      const searchStr = q.toLowerCase();
      todos = todos.filter(t => 
        (t.title && t.title.toLowerCase().includes(searchStr)) ||
        (t.description && t.description.toLowerCase().includes(searchStr)) ||
        (t.notes && t.notes.toLowerCase().includes(searchStr))
      );
    }

    // Filters
    if (category) {
      todos = todos.filter(t => t.category && t.category.toLowerCase() === category.toLowerCase());
    }

    if (priority) {
      todos = todos.filter(t => t.priority && t.priority.toLowerCase() === priority.toLowerCase());
    }

    if (status) {
      todos = todos.filter(t => t.status && t.status.toLowerCase() === status.toLowerCase());
    }

    // Sorting
    if (sortBy) {
      const isAsc = order === 'asc' ? 1 : -1;
      todos.sort((a, b) => {
        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate) * isAsc;
        }
        if (sortBy === 'priority') {
          const valA = PRIORITY_MAP[a.priority] || 0;
          const valB = PRIORITY_MAP[b.priority] || 0;
          return (valA - valB) * isAsc;
        }
        if (sortBy === 'createdAt') {
          return a.createdAt.localeCompare(b.createdAt) * isAsc;
        }
        return 0;
      });
    }

    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Get single todo by ID
app.get('/api/todos/:id', async (req, res) => {
  try {
    const todos = await readDB();
    const todo = todos.find(t => t.id === req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Create a new todo
app.post('/api/todos', async (req, res) => {
  try {
    const { title, description, category, priority, dueDate, subtasks = [], notes } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const todos = await readDB();
    const now = new Date().toISOString();

    const newTodo = {
      id: uuidv4(),
      title: title.trim(),
      description: (description || '').trim(),
      status: 'pending',
      priority: priority || 'medium',
      category: category || 'Other',
      dueDate: dueDate || '',
      createdAt: now,
      updatedAt: now,
      subtasks: subtasks.map((st, i) => ({
        id: `st-${Date.now()}-${i}`,
        title: st.title.trim(),
        completed: !!st.completed
      })),
      notes: (notes || '').trim()
    };

    todos.unshift(newTodo); // Add to the top
    await writeDB(todos);
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Update a todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    const todos = await readDB();
    const index = todos.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const existing = todos[index];
    const updateData = req.body;

    // Build the updated todo object
    const updatedTodo = {
      ...existing,
      title: updateData.title !== undefined ? updateData.title.trim() : existing.title,
      description: updateData.description !== undefined ? updateData.description.trim() : existing.description,
      status: updateData.status !== undefined ? updateData.status : existing.status,
      priority: updateData.priority !== undefined ? updateData.priority : existing.priority,
      category: updateData.category !== undefined ? updateData.category : existing.category,
      dueDate: updateData.dueDate !== undefined ? updateData.dueDate : existing.dueDate,
      notes: updateData.notes !== undefined ? updateData.notes.trim() : existing.notes,
      updatedAt: new Date().toISOString()
    };

    if (updateData.subtasks !== undefined) {
      updatedTodo.subtasks = updateData.subtasks.map((st) => ({
        id: st.id || `st-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: st.title.trim(),
        completed: !!st.completed
      }));
    }

    todos[index] = updatedTodo;
    await writeDB(todos);
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const todos = await readDB();
    const filtered = todos.filter(t => t.id !== req.params.id);
    if (todos.length === filtered.length) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    await writeDB(filtered);
    res.json({ success: true, message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve static assets in production
const clientBuildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(clientBuildPath));

// MPA page routes in production
app.get('/todo.html', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'todo.html'));
});

app.get('/todo', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'todo.html'));
});

// Fallback all other non-API routes to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API Endpoint not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
