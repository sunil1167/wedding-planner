import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import TaskCard from '../components/TaskCard';
import styles from '../styles/Home.module.css';

const EMPTY_FORM = {
  title: '',
  category: 'other',
  dueDate: '',
  totalCost: '',
  amountPaid: '',
  notes: '',
  extraInfo: '',
};

const CATEGORIES = [
  { value: 'venue',       label: 'Venue',       icon: '🏛️' },
  { value: 'catering',    label: 'Catering',    icon: '🍽️' },
  { value: 'decoration',  label: 'Decoration',  icon: '🌸' },
  { value: 'photography', label: 'Photography', icon: '📷' },
  { value: 'music',       label: 'Music',       icon: '🎵' },
  { value: 'attire',      label: 'Attire',      icon: '👗' },
  { value: 'other',       label: 'Other',       icon: '✨' },
];

const FILTERS = ['All', 'Pending', 'Completed', 'Overdue'];
const SORT_OPTIONS = [
  { value: 'created',  label: 'Recently Added' },
  { value: 'dueDate',  label: 'Due Date'        },
  { value: 'cost',     label: 'Total Cost'      },
  { value: 'progress', label: 'Progress'        },
];

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created');
  const [search, setSearch] = useState('');
  const [formErrors, setFormErrors] = useState({});

  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      const normalized = data.map(t => ({
        ...t,
        dueDate:    t.dueDate    ?? t.due_date    ?? '',
        totalCost:  t.totalCost  ?? t.total_cost  ?? 0,
        amountPaid: t.amountPaid ?? t.amount_paid ?? 0,
        extraInfo:  t.extraInfo  ?? t.extra_info  ?? '',
      }));
      setTasks(normalized);
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTasks(); }, []);

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    const totalBudget = tasks.reduce((s, t) => s + (parseFloat(t.totalCost) || 0), 0);
    const totalPaid = tasks.reduce((s, t) => s + (parseFloat(t.amountPaid) || 0), 0);
    const today = new Date(); today.setHours(0,0,0,0);
    const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today).length;
    return { total, done, totalBudget, totalPaid, overdue };
  }, [tasks]);

  // ── Filtered + Sorted tasks ────────────────────────────
  const displayTasks = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    let result = tasks.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !(t.notes || '').toLowerCase().includes(q)) return false;
      }
      if (filter === 'Pending')   return !t.completed;
      if (filter === 'Completed') return t.completed;
      if (filter === 'Overdue')   return !t.completed && t.dueDate && new Date(t.dueDate) < today;
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'cost') return (parseFloat(b.totalCost) || 0) - (parseFloat(a.totalCost) || 0);
      if (sortBy === 'progress') {
        const pa = a.totalCost > 0 ? a.amountPaid / a.totalCost : 0;
        const pb = b.totalCost > 0 ? b.amountPaid / b.totalCost : 0;
        return pb - pa;
      }
      return 0;
    });

    return result;
  }, [tasks, filter, sortBy, search]);

  // ── Modal ──────────────────────────────────────────────
  function openAdd() {
    setEditingTask(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    setForm({ ...task, totalCost: task.totalCost?.toString() || '', amountPaid: task.amountPaid?.toString() || '' });
    setFormErrors({});
    setShowModal(true);
  }

  function validateForm() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    const total = parseFloat(form.totalCost);
    const paid = parseFloat(form.amountPaid);
    if (form.totalCost && isNaN(total)) errs.totalCost = 'Must be a number';
    if (form.amountPaid && isNaN(paid)) errs.amountPaid = 'Must be a number';
    if (!isNaN(total) && !isNaN(paid) && paid > total) errs.amountPaid = 'Cannot exceed total cost';
    return errs;
  }

  async function handleSubmit() {
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    const payload = {
      ...editingTask,
      ...form,
      totalCost:  parseFloat(form.totalCost)  || 0,
      amountPaid: parseFloat(form.amountPaid) || 0,
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
  }

  async function handleDelete(id) {
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

  // ── Progress ring helper ──────────────────────────────
  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const ringCirc = 2 * Math.PI * 36; // r=36

  return (
    <>
      <Head>
        <title>Eternal — Wedding Planner</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.page}>
        {/* ── Background ornament ── */}
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgOrb3} />

        {/* ── Hero header ── */}
        <header className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.logoMark}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 3 C16 3, 8 9, 8 17 C8 22, 11.5 26, 16 27 C20.5 26, 24 22, 24 17 C24 9, 16 3, 16 3Z" fill="none" stroke="#b5956a" strokeWidth="1.2"/>
                <path d="M16 27 C16 27, 6 20, 4 14" stroke="#b5956a" strokeWidth="0.8" strokeOpacity="0.5"/>
                <path d="M16 27 C16 27, 26 20, 28 14" stroke="#b5956a" strokeWidth="0.8" strokeOpacity="0.5"/>
                <circle cx="16" cy="16" r="2.5" fill="#b5956a" fillOpacity="0.7"/>
              </svg>
            </div>
            <div>
              <h1 className={styles.heroTitle}>Eternal</h1>
              <p className={styles.heroSub}>Your wedding, beautifully planned</p>
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div className={styles.statsStrip}>
            <div className={styles.statCard}>
              <svg className={styles.ringsvg} viewBox="0 0 84 84">
                <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(181,149,106,0.15)" strokeWidth="5" />
                <circle cx="42" cy="42" r="36" fill="none" stroke="url(#goldGrad)" strokeWidth="5"
                  strokeDasharray={ringCirc} strokeDashoffset={ringCirc * (1 - completionPct / 100)}
                  strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease' }}
                />
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#b5956a" />
                    <stop offset="100%" stopColor="#d4b483" />
                  </linearGradient>
                </defs>
                <text x="42" y="46" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="Cormorant Garamond, serif" fill="#3d2e1e">{completionPct}%</text>
              </svg>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Completion</span>
                <span className={styles.statVal}>{stats.done} of {stats.total} done</span>
              </div>
            </div>

            <div className={styles.statDivider} />

            <div className={styles.statCard}>
              <div className={styles.statIcon}>💰</div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Total Budget</span>
                <span className={styles.statVal}>₹{stats.totalBudget.toLocaleString('en-IN')}</span>
                <span className={styles.statSub}>₹{stats.totalPaid.toLocaleString('en-IN')} paid</span>
              </div>
            </div>

            <div className={styles.statDivider} />

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ filter: stats.overdue ? 'none' : undefined }}>
                {stats.overdue > 0 ? '⚠️' : '✅'}
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Tasks Overdue</span>
                <span className={styles.statVal} style={{ color: stats.overdue > 0 ? '#b05050' : '#7a9e7a' }}>
                  {stats.overdue}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Toolbar ── */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search tasks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            {FILTERS.map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
                {f === 'Overdue' && stats.overdue > 0 && (
                  <span className={styles.filterBadge}>{stats.overdue}</span>
                )}
              </button>
            ))}
          </div>

          <div className={styles.sortWrap}>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <button className={styles.addBtn} onClick={openAdd}>
            <span className={styles.addIcon}>+</span> Add Task
          </button>
        </div>

        {/* ── Grid ── */}
        <main className={styles.main}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Loading your plans…</p>
            </div>
          ) : displayTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyOrb}>🌸</div>
              <h3>No tasks found</h3>
              <p>{search ? 'Try a different search term.' : 'Start planning your perfect day.'}</p>
              {!search && <button className={styles.addBtn} onClick={openAdd}>+ Add your first task</button>}
            </div>
          ) : (
            <div className={styles.grid}>
              {displayTasks.map((task, i) => (
                <div
                  key={task.id}
                  className={styles.cardWrapper}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
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
        </main>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {/* Title */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Task Title *</label>
                <input
                  className={`${styles.input} ${formErrors.title ? styles.inputError : ''}`}
                  placeholder="e.g. Book the reception venue"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
                {formErrors.title && <span className={styles.fieldError}>{formErrors.title}</span>}
              </div>

              {/* Category */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Category</label>
                <div className={styles.catGrid}>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      className={`${styles.catChip} ${form.category === c.value ? styles.catChipActive : ''}`}
                      onClick={() => setForm(f => ({ ...f, category: c.value }))}
                    >
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Due Date</label>
                <input
                  className={styles.input}
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>

              {/* Budget row */}
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Total Cost (₹)</label>
                  <input
                    className={`${styles.input} ${formErrors.totalCost ? styles.inputError : ''}`}
                    type="number"
                    placeholder="0"
                    min="0"
                    value={form.totalCost}
                    onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))}
                  />
                  {formErrors.totalCost && <span className={styles.fieldError}>{formErrors.totalCost}</span>}
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Amount Paid (₹)</label>
                  <input
                    className={`${styles.input} ${formErrors.amountPaid ? styles.inputError : ''}`}
                    type="number"
                    placeholder="0"
                    min="0"
                    value={form.amountPaid}
                    onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))}
                  />
                  {formErrors.amountPaid && <span className={styles.fieldError}>{formErrors.amountPaid}</span>}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.modalBtn} ${styles.modalBtnGhost}`} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={handleSubmit}>
                {editingTask ? '✓ Update Task' : '+ Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}