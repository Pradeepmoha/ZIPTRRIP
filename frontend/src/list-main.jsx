import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Search, Plus, Trash2, Calendar, CheckSquare, 
  Tag, AlertTriangle, TrendingUp, X, ExternalLink, Clock, Sparkles
} from 'lucide-react';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from './api';
import './index.css';

function Dashboard() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form State for New Todo
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Work');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newSubtasks, setNewSubtasks] = useState([]);
  const [tempSubtaskText, setTempSubtaskText] = useState('');

  // Statistics calculation
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    progress: 0
  });

  // Show notification alert
  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch todos with filters
  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await fetchTodos({
        q: search,
        category: categoryFilter,
        priority: priorityFilter,
        status: statusFilter,
        sortBy,
        order: sortOrder
      });
      setTodos(data);
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Error loading todos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Run load on state change (debounced search can be added, but manual/simple is robust)
  useEffect(() => {
    const handler = setTimeout(() => {
      loadTodos();
    }, 300);
    return () => clearTimeout(handler);
  }, [search, categoryFilter, priorityFilter, statusFilter, sortBy, sortOrder]);

  // Recalculate stats when todos change
  useEffect(() => {
    // We calculate stats from ALL todos, so let's fetch raw stats from the backend or calculate from current listing.
    // For simplicity, we can fetch all todos to calculate accurate stats, or just use current items. 
    // Let's do a quick fetch of unfiltered todos for the stats panel!
    async function calculateGlobalStats() {
      try {
        const allData = await fetchTodos();
        const total = allData.length;
        const completed = allData.filter(t => t.status === 'completed').length;
        const pending = allData.filter(t => t.status === 'pending' || t.status === 'in-progress').length;
        
        // Count overdue
        const todayStr = new Date().toISOString().split('T')[0];
        const overdue = allData.filter(t => 
          t.status !== 'completed' && 
          t.dueDate && 
          t.dueDate < todayStr
        ).length;

        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        setStats({ total, completed, pending, overdue, progress });
      } catch (err) {
        console.error('Stats error:', err);
      }
    }
    calculateGlobalStats();
  }, [todos]);

  // Handle Quick Status Toggle Checkbox
  const handleStatusToggle = async (todo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      const updated = await updateTodo(todo.id, { status: newStatus });
      setTodos(todos.map(t => t.id === todo.id ? updated : t));
      triggerNotification(`Task "${todo.title}" marked as ${newStatus}!`);
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to update status', 'error');
    }
  };

  // Handle Delete Todo
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete task "${title}"?`)) return;
    try {
      await deleteTodo(id);
      setTodos(todos.filter(t => t.id !== id));
      triggerNotification(`Task "${title}" deleted successfully.`);
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to delete task', 'error');
    }
  };

  // Add temporary subtask to list before creating todo
  const handleAddTempSubtask = (e) => {
    e.preventDefault();
    if (!tempSubtaskText.trim()) return;
    setNewSubtasks([...newSubtasks, { title: tempSubtaskText.trim(), completed: false }]);
    setTempSubtaskText('');
  };

  // Remove temporary subtask
  const handleRemoveTempSubtask = (index) => {
    setNewSubtasks(newSubtasks.filter((_, i) => i !== index));
  };

  // Create new Todo
  const handleCreateTodo = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      triggerNotification('Task title is required!', 'error');
      return;
    }

    try {
      const created = await createTodo({
        title: newTitle,
        description: newDescription,
        category: newCategory,
        priority: newPriority,
        dueDate: newDueDate,
        notes: newNotes,
        subtasks: newSubtasks
      });

      setTodos([created, ...todos]);
      triggerNotification(`Task "${created.title}" created successfully!`);
      
      // Reset Form fields
      setNewTitle('');
      setNewDescription('');
      setNewCategory('Work');
      setNewPriority('medium');
      setNewDueDate('');
      setNewNotes('');
      setNewSubtasks([]);
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to create task', 'error');
    }
  };

  // Helper: check relative due date alert class
  const getDueDateLabel = (dueDate, status) => {
    if (!dueDate) return null;
    if (status === 'completed') {
      return <span className="todo-meta-item"><Calendar size={12}/> {dueDate}</span>;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (dueDate < todayStr) {
      return <span className="todo-meta-item time-overdue"><AlertTriangle size={12}/> Overdue ({dueDate})</span>;
    } else if (dueDate === todayStr) {
      return <span className="todo-meta-item time-today"><Clock size={12}/> Today</span>;
    }
    return <span className="todo-meta-item time-upcoming"><Calendar size={12}/> {dueDate}</span>;
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header>
        <div className="brand-section">
          <h1>TODO Tasks</h1>
          <p>Organize, track, and complete your tasks with effortless precision.</p>
        </div>
        <div className="header-actions">
          <button 
            id="btn-toggle-form"
            className="btn btn-primary" 
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            {isFormOpen ? <X size={18}/> : <Plus size={18}/>}
            {isFormOpen ? 'Close Editor' : 'New Task'}
          </button>
        </div>
      </header>

      {/* Notification Banner */}
      {notification && (
        <div className={`notification-banner ${notification.type === 'success' ? 'notification-success' : 'notification-error'}`}>
          <span>{notification.message}</span>
          <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setNotification(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="stats-row">
        <div className="glass-panel stat-card">
          <span className="value text-primary">{stats.total}</span>
          <span className="label">Total Tasks</span>
        </div>
        <div className="glass-panel stat-card">
          <span className="value" style={{ color: 'var(--status-completed)' }}>{stats.completed}</span>
          <span className="label">Completed</span>
        </div>
        <div className="glass-panel stat-card">
          <span className="value" style={{ color: 'var(--status-pending)' }}>{stats.pending}</span>
          <span className="label">Pending</span>
        </div>
        <div className="glass-panel stat-card">
          <span className="value" style={{ color: 'var(--priority-high)' }}>{stats.overdue}</span>
          <span className="label">Overdue</span>
        </div>
      </div>

      {stats.total > 0 && (
        <div className="glass-panel" style={{ marginBottom: '2.5rem', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            <span>Overall Progress</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.progress}%</span>
          </div>
          <div className="progress-container">
            <div className="progress-fill" style={{ width: `${stats.progress}%` }}></div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="dashboard-grid">
        
        {/* Sidebar Creation Form (or placeholder details) */}
        <div className={`sidebar-section ${isFormOpen ? 'active' : ''}`}>
          {isFormOpen ? (
            <div className="glass-panel">
              <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: '#818CF8' }}/> Create New Task
              </h3>
              
              <form onSubmit={handleCreateTodo}>
                <div className="form-group">
                  <label htmlFor="task-title">Title *</label>
                  <input 
                    id="task-title"
                    type="text" 
                    placeholder="e.g. Schedule team sync" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-description">Description</label>
                  <input 
                    id="task-description"
                    type="text" 
                    placeholder="Short summary..." 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="task-category">Category</label>
                    <select 
                      id="task-category"
                      value={newCategory} 
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Health">Health</option>
                      <option value="Finance">Finance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-priority">Priority</label>
                    <select 
                      id="task-priority"
                      value={newPriority} 
                      onChange={(e) => setNewPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="task-duedate">Due Date</label>
                  <input 
                    id="task-duedate"
                    type="date" 
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>

                {/* Subtask additions */}
                <div className="form-group">
                  <label>Initial Subtasks</label>
                  <div className="subtask-input-row" style={{ marginBottom: '0.75rem' }}>
                    <input 
                      id="input-temp-subtask"
                      type="text" 
                      placeholder="Add a checklist item..." 
                      value={tempSubtaskText}
                      onChange={(e) => setTempSubtaskText(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleAddTempSubtask}
                    >
                      Add
                    </button>
                  </div>
                  {newSubtasks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
                      {newSubtasks.map((st, index) => (
                        <div key={index} className="subtask-item" style={{ padding: '0.4rem 0.75rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>{st.title}</span>
                          <button 
                            type="button" 
                            className="btn btn-icon btn-secondary btn-sm" 
                            onClick={() => handleRemoveTempSubtask(index)}
                          >
                            <X size={12}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="task-notes">Additional Notes</label>
                  <textarea 
                    id="task-notes"
                    placeholder="Enter formatted notes, guidelines, or checklists..." 
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  ></textarea>
                </div>

                <button id="btn-save-task" type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Create Task
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
              <h3>Quick Guide</h3>
              <p style={{ margin: '1rem 0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Use the filters on the right to search tasks by keywords, filter categories, or change sorting. Click on a task title to view full details, add subtasks, and write notes.
              </p>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsFormOpen(true)}>
                Create a Task
              </button>
            </div>
          )}
        </div>

        {/* Tasks List Section */}
        <div className="main-section">
          {/* Controls Bar */}
          <div className="glass-panel controls-bar">
            <div className="search-wrapper">
              <Search className="search-icon" size={18} />
              <input 
                id="search-input"
                type="text" 
                placeholder="Search title, details, or notes..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="filters-wrapper">
              <select 
                id="filter-category"
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Shopping">Shopping</option>
                <option value="Health">Health</option>
                <option value="Finance">Finance</option>
                <option value="Other">Other</option>
              </select>

              <select 
                id="filter-priority"
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <select 
                id="filter-status"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select 
                id="sort-by"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Created Date</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
              </select>

              <button 
                id="btn-sort-order"
                className="btn btn-secondary btn-sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{ padding: '0.6rem 0.8rem', minHeight: '38px' }}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>

          {/* List Display */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Syncing with datastore...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="glass-panel empty-state">
              <CheckSquare className="empty-state-icon" size={48} />
              <h3>No tasks found</h3>
              <p>Try refining your filters or search keywords, or create a new task.</p>
            </div>
          ) : (
            <div className="todos-list">
              {todos.map(todo => {
                const subCompleted = todo.subtasks ? todo.subtasks.filter(s => s.completed).length : 0;
                const subTotal = todo.subtasks ? todo.subtasks.length : 0;
                const subProgress = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;

                return (
                  <div 
                    key={todo.id} 
                    className={`glass-panel todo-item ${todo.status === 'completed' ? 'completed' : ''}`}
                  >
                    {/* Status checkbox */}
                    <div className="todo-checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        className="todo-checkbox"
                        checked={todo.status === 'completed'}
                        onChange={() => handleStatusToggle(todo)}
                        title="Mark Complete"
                      />
                    </div>

                    {/* Todo Details */}
                    <div className="todo-content">
                      <div className="todo-header">
                        <a 
                          href={`/todo.html?id=${todo.id}`} 
                          className="todo-title"
                        >
                          {todo.title}
                        </a>
                        <span className={`badge badge-priority-${todo.priority}`}>
                          {todo.priority}
                        </span>
                        <span className={`badge badge-category badge-category-${todo.category.toLowerCase()}`}>
                          <Tag size={10} style={{ marginRight: '2px' }}/> {todo.category}
                        </span>
                      </div>
                      
                      {todo.description && (
                        <p className="todo-description">{todo.description}</p>
                      )}

                      <div className="todo-meta">
                        {getDueDateLabel(todo.dueDate, todo.status)}

                        {subTotal > 0 && (
                          <span className="todo-meta-item">
                            <CheckSquare size={12}/> Checklist ({subCompleted}/{subTotal})
                          </span>
                        )}

                        <span className="todo-meta-item">
                          Status: <b style={{ textTransform: 'capitalize' }}>{todo.status}</b>
                        </span>
                      </div>

                      {/* Checklist Progress Bar */}
                      {subTotal > 0 && (
                        <div style={{ marginTop: '0.4rem', maxWidth: '200px' }}>
                          <div className="progress-container" style={{ height: '4px', margin: '0' }}>
                            <div className="progress-fill" style={{ width: `${subProgress}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="todo-actions">
                      <a 
                        href={`/todo.html?id=${todo.id}`}
                        className="btn btn-secondary btn-icon btn-sm"
                        title="View Details"
                        style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button 
                        className="btn btn-danger btn-icon btn-sm"
                        onClick={() => handleDelete(todo.id, todo.title)}
                        title="Delete Task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Mount app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Dashboard />);
