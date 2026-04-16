import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import TaskCard from '../components/TaskCard';
import styles from '../styles/Home.module.css';

const CATEGORIES = ['venue', 'catering', 'decoration', 'photography', 'music', 'attire', 'stationery', 'transport', 'other'];

const EMPTY_FORM = {
  title: '',
  category: 'other',
  dueDate: '',
  totalCost: '',
  amountPaid: '',
  notes: '',
  extraInfo: '',
};

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();

      // Mapping variables to match your JSON structure
      const normalized = data.map(t => ({
        id: String(t.id),
        title: t.title || '',
        category: t.category || 'other',
        dueDate: t.dueDate || '',
        completed: t.completed ?? false,
        totalCost: parseFloat(t.totalCost) || 0,
        amountPaid: parseFloat(t.amountPaid) || 0,
        notes: t.notes || '',
        extraInfo: t.extraInfo || '',
        createdAt: t.createdAt || new Date().toISOString(),
      }));

      setTasks(normalized);
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTasks(); }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const totalBudget = tasks.reduce((s, t) => s + (t.totalCost || 0), 0);
    const totalSpent = tasks.reduce((s, t) => s + (t.amountPaid || 0), 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, totalBudget, totalSpent, pct };
  }, [tasks]);

  function openAdd() {
    setEditingTask(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    setForm({
      title: task.title || '',
      category: task.category || 'other',
      dueDate: task.dueDate || '',
      totalCost: String(task.totalCost || ''),
      amountPaid: String(task.amountPaid || ''),
      notes: task.notes || '',
      extraInfo: task.extraInfo || '',
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) { setFormError('Task title is required.'); return; }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        category: form.category,
        dueDate: form.dueDate,
        totalCost: parseFloat(form.totalCost) || 0,
        amountPaid: parseFloat(form.amountPaid) || 0,
        notes: form.notes,
        extraInfo: form.extraInfo,
        completed: editingTask ? editingTask.completed : false,
      };

      if (editingTask) {
        await fetch(`/api/tasks?id=${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingTask.id }),
        });
      } else {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await fetchTasks();
      setShowModal(false);
    } catch (e) {
      setFormError('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    await fetchTasks();
  }

  async function handleToggle(id, completed) {
    const task = tasks.find(t => t.id === id);
    await fetch(`/api/tasks?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, completed }),
    });
    await fetchTasks();
  }

  async function handleUpdateNotes(id, { notes, extraInfo }) {
    const task = tasks.find(t => t.id === id);
    await fetch(`/api/tasks?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, notes, extraInfo }),
    });
    await fetchTasks();
  }

  return (
    <>
      <Head><title>Wedding Planner — Tasks & Budget</title></Head>

      <div className={styles.page}>
        <div className={styles.header}>
            <h1>Wedding Roadmap</h1>
            <button className={styles.addBtn} onClick={openAdd}>＋ Add Task</button>
        </div>

        {loading ? (
          <div className={styles.loader}>Loading...</div>
        ) : (
          <div className={styles.taskGrid}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onUpdateNotes={handleUpdateNotes}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{editingTask ? 'Edit Task' : 'New Task'}</h3>
            
            <label>Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Wedding Cake" />

            <label>Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
            </select>

            <label>Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />

            <div className={styles.formRow}>
                <div>
                    <label>Total Cost</label>
                    <input type="number" value={form.totalCost} onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))} placeholder="0" />
                </div>
                <div>
                    <label>Amount Paid</label>
                    <input type="number" value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))} placeholder="0" />
                </div>
            </div>

            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Details..." />

            <label>Extra Info / Contacts</label>
            <input value={form.extraInfo} onChange={e => setForm(f => ({ ...f, extraInfo: e.target.value }))} placeholder="Vendor contact info..." />

            {formError && <p className={styles.error}>{formError}</p>}

            <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button className={styles.saveBtn} onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Add Task'}
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}