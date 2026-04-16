import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import TaskCard from '../components/TaskCard';
import styles from '../styles/Home.module.css';

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

  async function fetchTasks() {
    const res = await fetch('/api/tasks');
    const data = await res.json();

    const normalized = data.map(t => ({
      ...t,
      dueDate: t.dueDate ?? t.due_date ?? '',
      totalCost: t.totalCost ?? t.total_cost ?? 0,
      amountPaid: t.amountPaid ?? t.amount_paid ?? 0,
      extraInfo: t.extraInfo ?? t.extra_info ?? '',
    }));

    setTasks(normalized);
    setLoading(false);
  }

  useEffect(() => { fetchTasks(); }, []);

  function openAdd() {
    setEditingTask(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    setForm(task);
    setShowModal(true);
  }

  async function handleSubmit() {
    const payload = {
      ...editingTask,
      ...form,
      totalCost: parseFloat(form.totalCost) || 0,
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

  return (
    <>
      <Head>
        <title>Wedding Planner</title>
      </Head>

      <div className={styles.page}>
        <button className={styles.addBtn} onClick={openAdd}>
          + Add Task
        </button>

        <div className={styles.grid}>
          {tasks.map(task => (
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
      </div>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <input
              placeholder="Title"
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
              placeholder="Total Cost"
              value={form.totalCost}
              onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))}
            />
            <input
              type="number"
              placeholder="Amount Paid"
              value={form.amountPaid}
              onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))}
            />

            <button onClick={handleSubmit}>
              {editingTask ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}