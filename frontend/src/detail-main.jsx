import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ArrowLeft, Calendar, Clock, Edit2, Trash2, 
  CheckSquare, Square, Save, X, Tag, AlertCircle, 
  CheckCircle2, MessageSquare, Plus, RefreshCw
} from 'lucide-react';
import { fetchTodoById, updateTodo, deleteTodo } from './api';
import './index.css';

function TodoDetails() {
  const [todoId, setTodoId] = useState(null);
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  
  // Subtasks editing state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Extract ID from query param on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    setTodoId(id);
  }, []);

  // Fetch Todo by ID
  const loadTodo = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchTodoById(id);
      setTodo(data);
      
      // Populate edit states
      setEditTitle(data.title);
      setEditDescription(data.description || '');
      setEditCategory(data.category);
      setEditPriority(data.priority);
      setEditStatus(data.status);
      setEditDueDate(data.dueDate || '');
      setEditNotes(data.notes || '');
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Error fetching task details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (todoId) {
      loadTodo(todoId);
    }
  }, [todoId]);

  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Toggle single subtask status
  const handleToggleSubtask = async (subtaskIndex) => {
    if (!todo) return;
    
    const updatedSubtasks = todo.subtasks.map((st, idx) => {
      if (idx === subtaskIndex) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    try {
      const updated = await updateTodo(todo.id, { subtasks: updatedSubtasks });
      setTodo(updated);
      triggerNotification('Subtask checklist updated!');
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to update subtask', 'error');
    }
  };

  // Delete a subtask
  const handleDeleteSubtask = async (subtaskIndex) => {
    if (!todo) return;
    
    const updatedSubtasks = todo.subtasks.filter((_, idx) => idx !== subtaskIndex);

    try {
      const updated = await updateTodo(todo.id, { subtasks: updatedSubtasks });
      setTodo(updated);
      triggerNotification('Subtask deleted successfully.');
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to delete subtask', 'error');
    }
  };

  // Add subtask inline
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !todo) return;

    const newSubtask = {
      title: newSubtaskTitle.trim(),
      completed: false
    };

    const updatedSubtasks = [...(todo.subtasks || []), newSubtask];

    try {
      const updated = await updateTodo(todo.id, { subtasks: updatedSubtasks });
      setTodo(updated);
      setNewSubtaskTitle('');
      triggerNotification('New checklist item added!');
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to add checklist item', 'error');
    }
  };

  // Save general updates
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      triggerNotification('Task title is required!', 'error');
      return;
    }

    try {
      const updated = await updateTodo(todo.id, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        priority: editPriority,
        status: editStatus,
        dueDate: editDueDate,
        notes: editNotes
      });
      setTodo(updated);
      setIsEditing(false);
      triggerNotification('Task updated successfully.');
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to save changes', 'error');
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!todo) return;
    if (!window.confirm(`Are you sure you want to permanently delete task "${todo.title}"?`)) return;

    try {
      await deleteTodo(todo.id);
      triggerNotification('Task deleted. Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      console.error(err);
      triggerNotification(err.message || 'Failed to delete task', 'error');
    }
  };

  // Helper date formatter
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, { 
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit' 
    });
  };

  // Check relative due date alert class
  const getDueDateLabel = (dueDate, status) => {
    if (!dueDate) return 'No due date set';
    if (status === 'completed') {
      return <span>{dueDate}</span>;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (dueDate < todayStr) {
      return <span className="time-overdue">Overdue ({dueDate})</span>;
    } else if (dueDate === todayStr) {
      return <span className="time-today">Today</span>;
    }
    return <span className="time-upcoming">{dueDate}</span>;
  };

  // Subtask progress
  const subCompleted = todo?.subtasks ? todo.subtasks.filter(s => s.completed).length : 0;
  const subTotal = todo?.subtasks ? todo.subtasks.length : 0;
  const subProgress = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;

  return (
    <div className="app-container">
      {/* Back button and title */}
      <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', borderBottom: 'none' }}>
        <a href="/" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </a>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <RefreshCw className="empty-state-icon" style={{ animation: 'spin 2s linear infinite' }} size={48} />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1.5rem' }}>Syncing with datastore...</p>
        </div>
      ) : !todo ? (
        <div className="glass-panel empty-state" style={{ minHeight: '300px' }}>
          <AlertCircle className="empty-state-icon" size={48} style={{ color: 'var(--priority-high)' }} />
          <h3>Task Not Found</h3>
          <p>The request parameters contain an invalid or non-existent Task ID.</p>
          <a href="/" className="btn btn-primary">Go to Dashboard</a>
        </div>
      ) : (
        <div className="detail-layout">
          {/* Main Content Pane */}
          <div className="main-section">
            
            {isEditing ? (
              // Editing Mode Form
              <div className="glass-panel">
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit2 size={20} style={{ color: 'var(--border-focus)' }}/> Edit Task
                </h2>
                
                <form onSubmit={handleSaveChanges}>
                  <div className="form-group">
                    <label htmlFor="edit-title">Title *</label>
                    <input 
                      id="edit-title"
                      type="text" 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-description">Description</label>
                    <input 
                      id="edit-description"
                      type="text" 
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-category">Category</label>
                      <select 
                        id="edit-category"
                        value={editCategory} 
                        onChange={(e) => setEditCategory(e.target.value)}
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
                      <label htmlFor="edit-priority">Priority</label>
                      <select 
                        id="edit-priority"
                        value={editPriority} 
                        onChange={(e) => setEditPriority(e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-status">Status</label>
                      <select 
                        id="edit-status"
                        value={editStatus} 
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-duedate">Due Date</label>
                      <input 
                        id="edit-duedate"
                        type="date" 
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-notes">Notes / Checklist Details</label>
                    <textarea 
                      id="edit-notes"
                      className="notes-textarea"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      <Save size={18} /> Save Changes
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setIsEditing(false)}
                      style={{ flex: 1 }}
                    >
                      <X size={18} /> Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // Read Mode View
              <div className="glass-panel">
                <div className="detail-header">
                  <div>
                    <h2 className="detail-title">{todo.title}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      <span className={`badge badge-priority-${todo.priority}`}>
                        {todo.priority} Priority
                      </span>
                      <span className={`badge badge-category badge-category-${todo.category.toLowerCase()}`}>
                        <Tag size={10}/> {todo.category}
                      </span>
                      <span className="badge" style={{ 
                        backgroundColor: todo.status === 'completed' ? 'rgba(16,185,129,0.15)' : todo.status === 'in-progress' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
                        color: todo.status === 'completed' ? 'var(--status-completed)' : todo.status === 'in-progress' ? 'var(--status-inprogress)' : 'var(--status-pending)',
                        border: `1px solid ${todo.status === 'completed' ? 'rgba(16,185,129,0.3)' : todo.status === 'in-progress' ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'}`
                      }}>
                        Status: {todo.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <button 
                      id="btn-edit-mode"
                      className="btn btn-secondary" 
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 size={16} /> Edit Task
                    </button>
                  </div>
                </div>

                {todo.description ? (
                  <p className="detail-body">{todo.description}</p>
                ) : (
                  <p className="detail-body" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    No description provided.
                  </p>
                )}

                {/* Subtask Checklist Section */}
                <h3 className="detail-section-title">
                  <CheckSquare size={16} /> Checklist ({subCompleted}/{subTotal})
                </h3>
                
                {subTotal > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div className="progress-container">
                      <div className="progress-fill" style={{ width: `${subProgress}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="subtasks-list">
                  {todo.subtasks && todo.subtasks.map((st, index) => (
                    <div 
                      key={st.id} 
                      className={`subtask-item ${st.completed ? 'completed' : ''}`}
                    >
                      <div className="subtask-left">
                        <button 
                          className="btn btn-icon btn-secondary btn-sm"
                          onClick={() => handleToggleSubtask(index)}
                          style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer' }}
                        >
                          {st.completed ? (
                            <CheckSquare size={18} style={{ color: 'var(--status-completed)' }} />
                          ) : (
                            <Square size={18} style={{ color: 'var(--text-muted)' }} />
                          )}
                        </button>
                        <span className="subtask-title">{st.title}</span>
                      </div>
                      <button 
                        className="btn btn-icon btn-secondary btn-sm" 
                        onClick={() => handleDeleteSubtask(index)}
                        title="Delete Checklist Item"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Checklist Item Form */}
                <form onSubmit={handleAddSubtask} className="subtask-input-row">
                  <input 
                    id="input-subtask-title"
                    type="text" 
                    placeholder="Add checklist item..." 
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                    <Plus size={16}/> Add Item
                  </button>
                </form>

                {/* Notes Section */}
                <h3 className="detail-section-title">
                  <MessageSquare size={16} /> Additional Notes & Details
                </h3>
                {todo.notes ? (
                  <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.4)', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    {todo.notes}
                  </div>
                ) : (
                  <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No additional notes. Click "Edit Task" to write guidelines, lists, or general details.
                  </p>
                )}

              </div>
            )}
          </div>

          {/* Sidebar Info Pane */}
          <div className="meta-sidebar">
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem' }}>Metadata</h3>
              
              <div className="meta-info-block">
                <span className="meta-info-label">Due Date</span>
                <span className="meta-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} /> {getDueDateLabel(todo.dueDate, todo.status)}
                </span>
              </div>

              <div className="meta-info-block">
                <span className="meta-info-label">Created At</span>
                <span className="meta-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} /> {formatDate(todo.createdAt)}
                </span>
              </div>

              <div className="meta-info-block">
                <span className="meta-info-label">Last Modified</span>
                <span className="meta-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} /> {formatDate(todo.updatedAt)}
                </span>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {todo.status !== 'completed' ? (
                  <button 
                    id="btn-mark-complete"
                    className="btn btn-primary" 
                    onClick={async () => {
                      try {
                        const updated = await updateTodo(todo.id, { status: 'completed' });
                        setTodo(updated);
                        setEditStatus('completed');
                        triggerNotification('Task marked as Completed!');
                      } catch (err) {
                        triggerNotification(err.message, 'error');
                      }
                    }}
                  >
                    <CheckCircle2 size={16} /> Mark as Complete
                  </button>
                ) : (
                  <button 
                    id="btn-mark-pending"
                    className="btn btn-secondary" 
                    onClick={async () => {
                      try {
                        const updated = await updateTodo(todo.id, { status: 'pending' });
                        setTodo(updated);
                        setEditStatus('pending');
                        triggerNotification('Task reopened (Pending).');
                      } catch (err) {
                        triggerNotification(err.message, 'error');
                      }
                    }}
                  >
                    <AlertCircle size={16} /> Reopen Task
                  </button>
                )}
                
                <button 
                  id="btn-delete-task"
                  className="btn btn-danger" 
                  onClick={handleDeleteTask}
                >
                  <Trash2 size={16} /> Delete Task
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// Mount app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<TodoDetails />);
