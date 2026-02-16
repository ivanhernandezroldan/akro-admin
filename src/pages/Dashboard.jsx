
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const navigate = useNavigate();

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching clients:', error);
            } else {
                setClients(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('clients')
                .insert([newClient])
                .select();

            if (error) throw error;

            setClients([...data, ...clients]);
            setShowNewClientModal(false);
            setNewClient({ first_name: '', last_name: '', email: '', phone: '' });
        } catch (error) {
            alert('Error creating client: ' + error.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const filteredClients = clients.filter(client =>
        client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <div className="nav-brand">AKRO Admin</div>
                <div className="nav-user">
                    <span>{user?.email}</span>
                    <button onClick={handleLogout} className="logout-button">Sign Out</button>
                </div>
            </nav>

            <main className="main-content">
                <header className="page-header">
                    <div className="header-title">
                        <h1>Clients</h1>
                        <p>Manage your athletes and patients</p>
                    </div>
                    <div className="header-actions">
                        <input
                            type="text"
                            placeholder="Search clients..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                            className="primary-button"
                            onClick={() => setShowNewClientModal(true)}
                        >
                            + New Client
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="loading">Loading clients...</div>
                ) : (
                    <div className="clients-list">
                        {filteredClients.length === 0 ? (
                            <div className="empty-state">
                                <p>No clients found matching your search.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="clients-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Joined Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClients.map((client) => (
                                            <tr
                                                key={client.id}
                                                onClick={() => navigate(`/clients/${client.id}`)}
                                                className="clickable-row"
                                            >
                                                <td data-label="Name">
                                                    <div className="client-name">
                                                        <div className="avatar-placeholder">
                                                            {client.first_name[0]}{client.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{client.first_name} {client.last_name}</div>
                                                            <div className="text-sm text-gray">{client.phone}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Email">{client.email}</td>
                                                <td data-label="Status">
                                                    <span className={`status-badge active`}>
                                                        Active
                                                    </span>
                                                </td>
                                                <td data-label="Joined Date">{new Date(client.created_at).toLocaleDateString()}</td>
                                                <td data-label="Action">→</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {showNewClientModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add New Client</h2>
                        <form onSubmit={handleCreateClient}>
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    required
                                    value={newClient.first_name}
                                    onChange={e => setNewClient({ ...newClient, first_name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    required
                                    value={newClient.last_name}
                                    onChange={e => setNewClient({ ...newClient, last_name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={newClient.email}
                                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowNewClientModal(false)} className="secondary-button">Cancel</button>
                                <button type="submit" className="primary-button">Create Client</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
