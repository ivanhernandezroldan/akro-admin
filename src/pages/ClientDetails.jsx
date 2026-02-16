
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './ClientDetails.css';

const ClientDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, workouts, medical

    // Sub-data states
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [workouts, setWorkouts] = useState([]);
    const [exercises, setExercises] = useState([]);

    // Forms state
    const [showMedicalModal, setShowMedicalModal] = useState(false);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [newMedical, setNewMedical] = useState({ condition: '', description: '', status: 'active' });
    const [newWorkout, setNewWorkout] = useState({
        exercise_id: '',
        weight_kg: '',
        sets: '',
        reps: '',
        rpe: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchClientDetails();
    }, [id]);

    const fetchClientDetails = async () => {
        try {
            setLoading(true);

            // Fetch basic client info
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (clientError) throw clientError;
            setClient(clientData);

            // Fetch related data
            const { data: medicalData } = await supabase
                .from('medical_records')
                .select('*')
                .eq('client_id', id)
                .order('date_recorded', { ascending: false });

            setMedicalRecords(medicalData || []);

            const { data: workoutData } = await supabase
                .from('workout_logs')
                .select('*, exercises(name)')
                .eq('client_id', id)
                .order('date', { ascending: false })
                .limit(20);

            setWorkouts(workoutData || []);

            // Fetch exercises for key
            const { data: exercisesData } = await supabase
                .from('exercises')
                .select('*')
                .order('name', { ascending: true });

            setExercises(exercisesData || []);

        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedical = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Update existing record
                const { data, error } = await supabase
                    .from('medical_records')
                    .update({ ...newMedical })
                    .eq('id', editingId)
                    .select();

                if (error) throw error;

                setMedicalRecords(medicalRecords.map(r => r.id === editingId ? data[0] : r));
            } else {
                // Create new record
                const { data, error } = await supabase
                    .from('medical_records')
                    .insert([{ ...newMedical, client_id: id }])
                    .select();

                if (error) throw error;
                setMedicalRecords([data[0], ...medicalRecords]);
            }

            closeMedicalModal();
        } catch (error) {
            alert(error.message);
        }
    };

    const openEditMedical = (record) => {
        setNewMedical({
            condition: record.condition,
            description: record.description,
            status: record.status
        });
        setEditingId(record.id);
        setShowMedicalModal(true);
    };

    const closeMedicalModal = () => {
        setShowMedicalModal(false);
        setNewMedical({ condition: '', description: '', status: 'active' });
        setEditingId(null);
    };

    const handleAddWorkout = async (e) => {
        e.preventDefault();
        try {
            if (editingId && showWorkoutModal) {
                // Update existing workout
                const { data, error } = await supabase
                    .from('workout_logs')
                    .update({ ...newWorkout })
                    .eq('id', editingId)
                    .select('*, exercises(name)');

                if (error) throw error;

                setWorkouts(workouts.map(w => w.id === editingId ? data[0] : w));
            } else {
                // Create new workout
                const { data, error } = await supabase
                    .from('workout_logs')
                    .insert([{ ...newWorkout, client_id: id }])
                    .select('*, exercises(name)');

                if (error) throw error;
                setWorkouts([data[0], ...workouts]);
            }

            closeWorkoutModal();
        } catch (error) {
            alert('Error logging workout: ' + error.message);
        }
    };

    const openEditWorkout = (log) => {
        setNewWorkout({
            exercise_id: log.exercise_id,
            weight_kg: log.weight_kg,
            sets: log.sets,
            reps: log.reps,
            rpe: log.rpe,
            notes: log.notes || '',
            date: log.date.split('T')[0]
        });
        setEditingId(log.id);
        setShowWorkoutModal(true);
    };

    const closeWorkoutModal = () => {
        setShowWorkoutModal(false);
        setNewWorkout({
            exercise_id: '',
            weight_kg: '',
            sets: '',
            reps: '',
            rpe: '',
            notes: '',
            date: new Date().toISOString().split('T')[0]
        });
        setEditingId(null);
    };

    if (loading) return <div className="loading">Loading details...</div>;
    if (!client) return <div className="error">Client not found</div>;

    return (
        <div className="layout-container">
            <div className="details-container">
                <header className="details-header">
                    <button onClick={() => navigate('/')} className="back-button">← Back to Dashboard</button>
                    <div className="client-profile-header">
                        <div className="avatar-large">
                            {client.first_name[0]}{client.last_name[0]}
                        </div>
                        <div>
                            <h1>{client.first_name} {client.last_name}</h1>
                            <p className="subtitle">{client.email} • {client.phone}</p>
                        </div>
                    </div>
                </header>

                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`tab ${activeTab === 'medical' ? 'active' : ''}`}
                        onClick={() => setActiveTab('medical')}
                    >
                        Medical History
                    </button>
                    <button
                        className={`tab ${activeTab === 'workouts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('workouts')}
                    >
                        Workouts & Progress
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-grid">
                            <div className="card">
                                <h3>Contact Info</h3>
                                <p><strong>Email:</strong> {client.email}</p>
                                <p><strong>Phone:</strong> {client.phone || 'N/A'}</p>
                                <p><strong>Emergency Contact:</strong> {client.emergency_contact || 'N/A'}</p>
                                <p><strong>Joined:</strong> {new Date(client.created_at).toLocaleDateString()}</p>
                            </div>

                            <div className="card">
                                <h3>Recent Activity</h3>
                                {workouts.length > 0 ? (
                                    <ul className="activity-list">
                                        {workouts.slice(0, 3).map(w => (
                                            <li key={w.id}>
                                                Finished <strong>{w.exercises?.name}</strong> check - {new Date(w.date).toLocaleDateString()}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-gray">No recent workouts recorded.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'medical' && (
                        <div className="medical-section">
                            <div className="section-actions">
                                <h3>Medical Records</h3>
                                <button className="primary-button small" onClick={() => setShowMedicalModal(true)}>+ Add Record</button>
                            </div>

                            {medicalRecords.length === 0 ? (
                                <p className="empty-text">No medical records found.</p>
                            ) : (
                                <div className="records-list">
                                    {medicalRecords.map(record => (
                                        <div key={record.id} className="record-card">
                                            <div className="record-header">
                                                <h4>{record.condition}</h4>
                                                <div className="record-actions">
                                                    <span className={`status-tag ${record.status}`}>{record.status}</span>
                                                    <button
                                                        className="edit-icon-button"
                                                        onClick={() => openEditMedical(record)}
                                                    >
                                                        ✎
                                                    </button>
                                                </div>
                                            </div>
                                            <p>{record.description}</p>
                                            <span className="date-tag">{new Date(record.date_recorded).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'workouts' && (
                        <div className="workouts-section">
                            <div className="section-actions">
                                <h3>Workout History</h3>
                                <button className="primary-button small" onClick={() => setShowWorkoutModal(true)}>+ Log Workout</button>
                            </div>

                            {workouts.length === 0 ? (
                                <p className="empty-text">No workouts recorded yet.</p>
                            ) : (
                                <div className="workout-list">
                                    {workouts.map(log => (
                                        <div key={log.id} className="log-entry">
                                            <div className="log-date">
                                                <span className="day">{new Date(log.date).getDate()}</span>
                                                <span className="month">{new Date(log.date).toLocaleString('default', { month: 'short' })}</span>
                                            </div>
                                            <div className="log-details">
                                                <div className="log-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <h4>{log.exercises?.name}</h4>
                                                    <button
                                                        className="edit-icon-button"
                                                        onClick={() => openEditWorkout(log)}
                                                    >
                                                        ✎
                                                    </button>
                                                </div>
                                                <div className="log-stats">
                                                    <span>{log.weight_kg}kg</span>
                                                    <span>{log.sets} sets</span>
                                                    <span>{log.reps} reps</span>
                                                    {log.rpe && <span>RPE {log.rpe}</span>}
                                                </div>
                                                {log.notes && <p className="log-notes">{log.notes}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {showMedicalModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>{editingId ? 'Edit Medical Record' : 'Add Medical Record'}</h2>
                            <form onSubmit={handleAddMedical}>
                                <div className="form-group">
                                    <label>Condition / Injury</label>
                                    <input
                                        required
                                        value={newMedical.condition}
                                        onChange={e => setNewMedical({ ...newMedical, condition: e.target.value })}
                                        placeholder="e.g. Knee Pain, Surgery..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={newMedical.description}
                                        onChange={e => setNewMedical({ ...newMedical, description: e.target.value })}
                                        rows="3"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={newMedical.status}
                                        onChange={e => setNewMedical({ ...newMedical, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="chronic">Chronic</option>
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={closeMedicalModal} className="secondary-button">Cancel</button>
                                    <button type="submit" className="primary-button">{editingId ? 'Update Record' : 'Save Record'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showWorkoutModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>{editingId ? 'Edit Workout Log' : 'Log Workout'}</h2>
                            <form onSubmit={handleAddWorkout}>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newWorkout.date}
                                        onChange={e => setNewWorkout({ ...newWorkout, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Exercise</label>
                                    <select
                                        required
                                        value={newWorkout.exercise_id}
                                        onChange={e => setNewWorkout({ ...newWorkout, exercise_id: e.target.value })}
                                    >
                                        <option value="">Select Exercise</option>
                                        {exercises.map(ex => (
                                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group half">
                                        <label>Weight (kg)</label>
                                        <input
                                            type="number"
                                            value={newWorkout.weight_kg}
                                            onChange={e => setNewWorkout({ ...newWorkout, weight_kg: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group half">
                                        <label>RPE (1-10)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={newWorkout.rpe}
                                            onChange={e => setNewWorkout({ ...newWorkout, rpe: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group half">
                                        <label>Sets</label>
                                        <input
                                            type="number"
                                            required
                                            value={newWorkout.sets}
                                            onChange={e => setNewWorkout({ ...newWorkout, sets: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group half">
                                        <label>Reps</label>
                                        <input
                                            type="number"
                                            required
                                            value={newWorkout.reps}
                                            onChange={e => setNewWorkout({ ...newWorkout, reps: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Notes</label>
                                    <textarea
                                        rows="2"
                                        value={newWorkout.notes}
                                        onChange={e => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                                        placeholder="Optional notes..."
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={closeWorkoutModal} className="secondary-button">Cancel</button>
                                    <button type="submit" className="primary-button">{editingId ? 'Update Log' : 'Save Log'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientDetails;
