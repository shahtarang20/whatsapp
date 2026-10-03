"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type UserSummary = {
  _id: string;
  email: string;
  phone: string;
  serviceCode: string;
  messageCap: number;
  messagesSent: number;
  metaPhoneId?: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [cap, setCap] = useState('');
  const [metaPhoneId, setMetaPhoneId] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users as UserSummary[]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initial client fetch required to hydrate the admin table; the rule is intentionally bypassed here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, []);


  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, password, messageCap: cap, metaPhoneId })
    });
    const data = await res.json();
    if (data.success) {
      setUsers((currentUsers) => [data.user as UserSummary, ...currentUsers]);
      setEmail(''); setPhone(''); setPassword(''); setCap(''); setMetaPhoneId('');
      alert(`Client Created! Their Service Code is: ${data.user.serviceCode}`);
    } else {
      alert('Error creating user: ' + data.error);
    }
  };

  const handleUpdateCap = async (userId: string, currentCap: number) => {
    const newCap = prompt("Enter new message cap limit:", currentCap.toString());
    if (newCap && !isNaN(Number(newCap))) {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newCap })
      });
      const data = await res.json();
      if (data.success) {
        setUsers((currentUsers) => currentUsers.map((user) => user._id === userId ? (data.user as UserSummary) : user));
      }
    }
  };

  return (
    <main style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Admin Control Panel</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your clients, generate service codes, and control usage caps.</p>
        </div>
        <button 
          onClick={() => {
            document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            router.push('/login');
          }}
          style={{ background: 'rgba(255, 60, 60, 0.1)', color: '#ff4d4d', border: '1px solid rgba(255, 60, 60, 0.3)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease' }}
        >
          Logout
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }}>
        
        {/* Create Client Panel */}
        <section className="glass-panel" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Create New Client</h2>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Email Address</label>
              <input type="email" required className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Phone Number</label>
              <input type="text" required className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Temporary Password</label>
              <input type="text" required className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Message Cap (Limit)</label>
              <input type="number" required className="input-field" value={cap} onChange={e => setCap(e.target.value)} placeholder="e.g. 5000" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Meta Phone ID (Optional)</label>
              <input type="text" className="input-field" value={metaPhoneId} onChange={e => setMetaPhoneId(e.target.value)} placeholder="e.g. 1361469553714821" />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}>
              Generate Service Code
            </button>
          </form>
        </section>

        {/* Client List */}
        <section className="glass-panel">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Active Clients</h2>
          
          {loading ? <p>Loading clients...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>Service Code</th>
                    <th style={{ padding: '12px 8px' }}>Client Details</th>
                    <th style={{ padding: '12px 8px' }}>Meta Phone ID</th>
                    <th style={{ padding: '12px 8px' }}>Usage / Cap</th>
                    <th style={{ padding: '12px 8px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No clients created yet.</td>
                    </tr>
                  )}
                  {users.map((user) => (
                    <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 8px', fontWeight: 'bold', color: 'var(--primary)' }}>{user.serviceCode}</td>
                      <td style={{ padding: '16px 8px' }}>{user.email}<br/><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.phone}</span></td>
                      <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>{user.metaPhoneId || 'Default'}</td>
                      <td style={{ padding: '16px 8px' }}>{user.messagesSent} / {user.messageCap}</td>
                      <td style={{ padding: '16px 8px' }}>
                        <button 
                          onClick={() => handleUpdateCap(user._id, user.messageCap)}
                          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Change Cap
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
