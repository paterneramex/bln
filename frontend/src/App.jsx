import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api from './api';
import Login from './Login';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('customers');
  const [dashboardData, setDashboardData] = useState({ customers: [], ipsups: [], pools: [], hbs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Create Form State dynamically for Customer Creation (CRUD Add example)
  const [newCustomer, setNewCustomer] = useState({
    customer_name: '', SRVnewIdent: '', customer_ip: '', customer_relais: '',
    customer_mac_dhcp: '000000000000', customer_mac_arp: '000000000000', pool_code: 'DEFAULT', customer_etat: 'ACTIVE', customer_rmq: 'UI Provisioned'
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('customers/'), api.get('ipsups/'), api.get('pools/'), api.get('hbs/')])
      .then(([c, i, p, h]) => {
        setDashboardData({ customers: c.data, ipsups: i.data, pools: p.data, hbs: h.data });
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('customers/', newCustomer);
      fetchData(); // Hot reload table matrices instantly
      // Reset layout values
      setNewCustomer({
        customer_name: '', SRVnewIdent: '', customer_ip: '', customer_relais: '',
        customer_mac_dhcp: '000000000000', customer_mac_arp: '000000000000', pool_code: 'DEFAULT', customer_etat: 'ACTIVE', customer_rmq: 'UI Provisioned'
      });
    } catch (err) {
      alert("Failed to provision record: " + JSON.stringify(err.response?.data));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">B</div>
          <h1 className="text-xl font-semibold tracking-tight">BLN Enterprise System</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs transition cursor-pointer">
            Terminate Session
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2">
          {['customers', 'ipsups', 'pools', 'hbs'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition cursor-pointer ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              {tab}
            </button>
          ))}
        </div>

        {error && <div className="p-4 rounded-xl border border-rose-900 bg-rose-950/30 text-rose-300 text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-12 text-slate-500 animate-pulse font-mono text-sm">Querying active database sets...</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* Left Data Presentation Matrix Table Grid */}
            <div className="xl:col-span-2 border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono tracking-wider">
                      {activeTab === 'customers' && (
                        <>
                          <th className="p-4">Ident</th>
                          <th className="p-4">Client Name</th>
                          <th className="p-4">Assigned IP</th>
                          <th className="p-4">State</th>
                        </>
                      )}
                      {activeTab !== 'customers' && <th className="p-4">Resource Schema Record Fields</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {dashboardData[activeTab].map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-slate-900/40 text-slate-300 transition">
                        {activeTab === 'customers' ? (
                          <>
                            <td className="p-4 font-bold text-indigo-400">{item.SRVnewIdent}</td>
                            <td className="p-4 text-slate-200 max-w-[150px] truncate">{item.customer_name}</td>
                            <td className="p-4 text-emerald-400">{item.customer_ip}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${item.customer_etat === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {item.customer_etat}
                              </span>
                            </td>
                          </>
                        ) : (
                          <td className="p-4 max-w-lg truncate">{JSON.stringify(item)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Interactive CRUD Provisioning Panel */}
            <div className="border border-slate-800 rounded-xl bg-slate-950/80 p-5 shadow-xl space-y-4">
              <h3 className="text-md font-medium text-slate-200 flex items-center gap-2">🛠️ App Provisioner Engine</h3>
              <p className="text-xs text-slate-400">Insert custom dataset elements straight to your active MySQL target model configuration mapping rules.</p>
              
              {activeTab === 'customers' ? (
                <form onSubmit={handleCreateCustomer} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wide text-slate-400 uppercase">SRVnewIdent</label>
                    <input type="text" required placeholder="e.g. SRV2026_99" value={newCustomer.SRVnewIdent} onChange={e => setNewCustomer({...newCustomer, SRVnewIdent: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wide text-slate-400 uppercase">Customer Corporate Name</label>
                    <input type="text" required placeholder="Company Name Ltd" value={newCustomer.customer_name} onChange={e => setNewCustomer({...newCustomer, customer_name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wide text-slate-400 uppercase">IP Allocation Allocation</label>
                    <input type="text" required placeholder="192.168.10.25" value={newCustomer.customer_ip} onChange={e => setNewCustomer({...newCustomer, customer_ip: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wide text-slate-400 uppercase">Relay Interface</label>
                    <input type="text" required placeholder="192.168.10.1" value={newCustomer.customer_relais} onChange={e => setNewCustomer({...newCustomer, customer_relais: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <button type="submit" className="w-full py-2 px-4 mt-2 rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition font-medium text-xs text-white shadow-md cursor-pointer">
                    Commit to Active Registry
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded border border-slate-800 bg-slate-900/50 text-center text-xs text-slate-500 font-mono">
                  Select "customers" tab to interface with custom insert forms.
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// Global Routing Orchestrator Layout Config
export default function App() {
  const ProtectedRoute = ({ children }) => {
    return localStorage.getItem('access_token') ? children : <Navigate to="/login" replace />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}