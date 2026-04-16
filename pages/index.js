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

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  // Fetch
  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTasks(); }, []);

  // Derived data
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const totalBudget = tasks.reduce((s, t) => s + (parseFloat(t.totalCost) || 0), 0);
    const totalSpent = tasks.reduce((s, t) => s + (parseFloat(t.amountPaid) || 0), 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, totalBudget, totalSpent, pct };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q));
    }

    if (filterStatus === 'completed') list = list.filter(t => t.completed);
    if (filterStatus === 'pending') list = list.filter(t => !t.completed);

    if (filterCategory !== 'all') list = list.filter(t => t.category === filterCategory);

    list.sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'payment') {
        const pa = parseFloat(a.totalCost) > 0 ? parseFloat(a.amountPaid) / parseFloat(a.totalCost) : 0;
        const pb = parseFloat(b.totalCost) > 0 ? parseFloat(b.amountPaid) / parseFloat(b.totalCost) : 0;
        return pa - pb;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  }, [tasks, search, filterStatus, filterCategory, sortBy]);

  // Handlers
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
    if (!form.title.trim()) { setFormError('Task title is required.'); return; }
    setSubmitting(true);
    try {
      if (editingTask) {
        await fetch(`/api/tasks?id=${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editingTask, ...form }),
        });
      } else {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
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

  function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return '₹' + num.toLocaleString('en-IN');
  }

  return (
    <>
      <Head>
        <title>Wedding Planner — Tasks & Budget</title>
        <meta name="description" content="Elegant wedding task and expense tracker" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💍</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.page}>

        {/* HEADER */}
        <header className={styles.header}>
          <span className={styles.headerOrnament}>✦ Your Special Day ✦</span>
          <h1 className={styles.headerTitle}>Wedding <em>Planner</em></h1>
          <p className={styles.headerSubtitle}>Tasks · Expenses · Timeline</p>
          <div className={styles.headerDivider}><span>💍</span></div>
        </header>

        {/* DASHBOARD CARDS */}
        <section className={styles.dashboard}>
          <div className={styles.dashboardCards}>
            <div className={styles.dashCard} style={{ '--accent': '#c9a84c', animationDelay: '0ms' }}>
              <span className={styles.dashCardIcon}>📋</span>
              <div className={styles.dashCardValue}>{stats.total}</div>
              <div className={styles.dashCardLabel}>Total Tasks</div>
            </div>
            <div className={styles.dashCard} style={{ '--accent': '#8aad8a', animationDelay: '80ms' }}>
              <span className={styles.dashCardIcon}>✅</span>
              <div className={styles.dashCardValue}>{stats.completed}</div>
              <div className={styles.dashCardLabel}>Completed</div>
            </div>
            <div className={styles.dashCard} style={{ '--accent': '#d4a0a0', animationDelay: '160ms' }}>
              <span className={styles.dashCardIcon}>⏳</span>
              <div className={styles.dashCardValue}>{stats.total - stats.completed}</div>
              <div className={styles.dashCardLabel}>Pending</div>
            </div>
            <div className={styles.dashCard} style={{ '--accent': '#9b8aa3', animationDelay: '240ms' }}>
              <span className={styles.dashCardIcon}>💰</span>
              <div className={styles.dashCardValue} style={{ fontSize: '1.4rem' }}>{formatCurrency(stats.totalBudget)}</div>
              <div className={styles.dashCardLabel}>Total Budget</div>
            </div>
            <div className={styles.dashCard} style={{ '--accent': '#7ba39e', animationDelay: '320ms' }}>
              <span className={styles.dashCardIcon}>💸</span>
              <div className={styles.dashCardValue} style={{ fontSize: '1.4rem' }}>{formatCurrency(stats.totalSpent)}</div>
              <div className={styles.dashCardLabel}>Amount Paid</div>
            </div>
          </div>
        </section>

        {/* PROGRESS BAR */}
        <section className={styles.progressSection}>
          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <span className={styles.progressTitle}>Wedding Readiness</span>
              <span className={styles.progressPct}>{stats.pct}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${stats.pct}%` }} />
            </div>
            <div className={styles.budgetRow}>
              <div className={styles.budgetItem}>
                <div className={styles.budgetDot} style={{ background: '#c9a84c' }} />
                <span>Budget: </span>
                <span className={styles.budgetAmount}>{formatCurrency(stats.totalBudget)}</span>
              </div>
              <div className={styles.budgetItem}>
                <div className={styles.budgetDot} style={{ background: '#8aad8a' }} />
                <span>Paid: </span>
                <span className={styles.budgetAmount}>{formatCurrency(stats.totalSpent)}</span>
              </div>
              <div className={styles.budgetItem}>
                <div className={styles.budgetDot} style={{ background: '#d4a0a0' }} />
                <span>Remaining: </span>
                <span className={styles.budgetAmount}>{formatCurrency(stats.totalBudget - stats.totalSpent)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* CONTROLS */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search tasks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <select className={styles.filterSelect} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select className={styles.filterSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="createdAt">Sort: Newest</option>
            <option value="dueDate">Sort: Due Date</option>
            <option value="payment">Sort: Payment</option>
          </select>
          <button className={styles.addBtn} onClick={openAdd}>
            ＋ Add Task
          </button>
        </div>

        {/* TASK GRID */}
        {loading ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>⏳</span>
            <div className={styles.emptyTitle}>Loading your tasks…</div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💐</span>
            <div className={styles.emptyTitle}>
              {tasks.length === 0 ? 'Start planning your dream wedding' : 'No tasks match your filters'}
            </div>
            <p className={styles.emptyText}>
              {tasks.length === 0 ? 'Click "+ Add Task" to begin.' : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <div className={styles.taskGrid}>
            {filteredTasks.map((task, i) => (
              <div key={task.id} style={{ animationDelay: `${i * 60}ms` }}>
                <TaskCard
                  task={task}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  onUpdateNotes={handleUpdateNotes}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className={styles.modalClose} onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            <h2 className={styles.modalTitle} id="modal-title">
              {editingTask ? 'Edit Task' : 'New Task'}
            </h2>
            <p className={styles.modalSubtitle}>
              {editingTask ? 'Update the details below' : 'Fill in the details for your wedding task'}
            </p>

            {formError && (
              <div style={{ color: '#c0504d', background: '#fff0f0', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', marginBottom: 18 }}>
                {formError}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="task-title">Task Title *</label>
              <input
                id="task-title"
                className={styles.formInput}
                type="text"
                placeholder="e.g. Book the florist"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="task-category">Category</label>
                <select
                  id="task-category"
                  className={styles.formSelect}
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="task-due">Due Date</label>
                <input
                  id="task-due"
                  className={styles.formInput}
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="task-cost">Total Cost (₹)</label>
                <input
                  id="task-cost"
                  className={styles.formInput}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.totalCost}
                  onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="task-paid">Amount Paid (₹)</label>
                <input
                  id="task-paid"
                  className={styles.formInput}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.amountPaid}
                  onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="task-notes">Notes</label>
              <textarea
                id="task-notes"
                className={styles.formTextarea}
                placeholder="Any important details about this task…"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="task-extra">Contacts / Extra Info</label>
              <textarea
                id="task-extra"
                className={styles.formTextarea}
                placeholder="Contact info, instructions, links…"
                value={form.extraInfo}
                onChange={e => setForm(f => ({ ...f, extraInfo: e.target.value }))}
                rows={2}
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving…' : editingTask ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
