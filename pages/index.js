import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import TaskCard from '../components/TaskCard';
import styles from '../styles/Home.module.css';

const CATEGORIES = ['venue', 'catering', 'decoration', 'photography', 'music', 'attire', 'stationery', 'transport', 'other'];

const EMPTY_FORM = {
  title: '',
  category: '',
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

      const normalized = data.map(t => ({
        ...t,
        dueDate: t.dueDate ?? t.due_date ?? '',
        totalCost: t.totalCost ?? t.total_cost ?? 0,
        amountPaid: t.amountPaid ?? t.amount_paid ?? 0,
        extraInfo: t.extraInfo ?? t.extra_info ?? '',
        createdAt: t.createdAt ?? new Date().toISOString(),
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
    const totalBudget = tasks.reduce((s, t) => s + (parseFloat(t.totalCost) || 0), 0);
    const totalSpent = tasks.reduce((s, t) => s + (parseFloat(t.amountPaid) || 0), 0);
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
      category: task.category || '',
      dueDate: task.dueDate || '',
      totalCost: task.totalCost != null ? String(task.totalCost) : '',
      amountPaid: task.amountPaid != null ? String(task.amountPaid) : '',
      notes: task.notes || '',
      extraInfo: task.extraInfo || '',
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setFormError('Task title is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...editingTask,
        ...form,
        totalCost: parseFloat(form.totalCost) || 0,
        amountPaid: parseFloat(form.amountPaid) || 0,
        dueDate: form.dueDate,
        extraInfo: form.extraInfo,
      };

      if (editingTask) {
        await fetch(`/api/tasks?id=${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
      setFormError('Something went wrong. Please try again.');
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
      <Head>
        <title>Wedding Planner — Tasks & Budget</title>
      </Head>

      <div className={styles.page}>
        <button className={styles.addBtn} onClick={openAdd}>
          ＋ Add Task
        </button>

        {loading ? (
          <div>Loading...</div>
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
        <div className={styles.modal}>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />

          <input
            type="date"
            value={form.dueDate}
            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
          />

          <input
            type="number"
            value={form.totalCost}
            onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))}
          />

          <input
            type="number"
            value={form.amountPaid}
            onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))}
          />

          <button onClick={handleSubmit}>
            {submitting ? 'Saving...' : editingTask ? 'Update' : 'Add'}
          </button>
        </div>
      )}
    </>
  );
}