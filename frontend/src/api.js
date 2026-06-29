// API Client helper for the Multi-Page Todo Application

const API_BASE = '/api';

/**
 * Fetch all todos with optional query filters and sorting.
 */
export async function fetchTodos(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  
  const response = await fetch(`${API_BASE}/todos?${params.toString()}`);
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || 'Failed to fetch todos');
  }
  return response.json();
}

/**
 * Fetch a single todo item by ID.
 */
export async function fetchTodoById(id) {
  const response = await fetch(`${API_BASE}/todos/${id}`);
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || 'Failed to fetch todo details');
  }
  return response.json();
}

/**
 * Create a new todo item.
 */
export async function createTodo(todoData) {
  const response = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(todoData),
  });
  
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || 'Failed to create todo');
  }
  return response.json();
}

/**
 * Update an existing todo item by ID.
 */
export async function updateTodo(id, todoData) {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(todoData),
  });
  
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || 'Failed to update todo');
  }
  return response.json();
}

/**
 * Delete a todo item by ID.
 */
export async function deleteTodo(id) {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || 'Failed to delete todo');
  }
  return response.json();
}
