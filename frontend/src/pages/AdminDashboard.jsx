import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import { FaUsers, FaChartLine, FaListOl } from "react-icons/fa";
import Navbar from "../components/Navbar";
export default function AdminDashboard() {
  const { auth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAttempts, setUserAttempts] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await api.get("/api/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to load users", err);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function openUserDetails(userId) {
    try {
      const res = await api.get(`/api/admin/user/${userId}/attempts`);
      setUserAttempts(res.data || []);
      setSelectedUser(userId);
    } catch (err) {
      console.error("Failed to load attempts");
    }
  }

  return (
    <>
    <Navbar />
    
    <div className="min-h-screen bg-gray-100 p-8 mt-9">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <span className="font-medium text-gray-700">
          {/* Logged in as: <b>{auth?.user?.email}</b> */}
        </span>
      </header>

      {/* Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <DashboardCard
          icon={<FaUsers className="text-blue-600 text-3xl" />}
          label="Total Users"
          value={users.length}
        />
        <DashboardCard
          icon={<FaChartLine className="text-green-600 text-3xl" />}
          label="Total Attempts"
          value={users.reduce((sum, u) => sum + (u.total_attempts || 0), 0)}
        />
        <DashboardCard
          icon={<FaListOl className="text-orange-600 text-3xl" />}
          label="Avg Accuracy"
          value={
            users.length
              ? (
                  users.reduce((sum, u) => sum + (u.accuracy || 0), 0) /
                  users.length
                ).toFixed(1) + "%"
              : "0%"
          }
        />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Users Overview</h2>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Quizzes Taken</th>
              <th>Accuracy</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b text-gray-700">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.total_attempts || 0}</td>
                <td>{u.accuracy ? `${u.accuracy}%` : "—"}</td>
                <td className="py-2">
                  <button
                    onClick={() => openUserDetails(u.id)}
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <p className="mt-6 text-gray-500">Loading...</p>}
      </div>

      {/* User attempts modal */}
      {selectedUser && (
        <UserDetailsModal
          attempts={userAttempts}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
    </>
  );
}

/* ----------------------------------------------------
   Dashboard Card Component
---------------------------------------------------- */
function DashboardCard({ icon, label, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
      {icon}
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <h3 className="text-xl font-bold">{value}</h3>
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   User Details Modal
---------------------------------------------------- */
function UserDetailsModal({ attempts, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white max-w-lg w-full rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">User Attempts</h2>

        <div className="max-h-80 overflow-y-auto">
          {attempts.length === 0 ? (
            <p className="text-gray-500">No attempts found</p>
          ) : (
            attempts.map((a) => (
              <div
                key={a.id}
                className="border p-3 rounded-lg mb-3 bg-gray-50"
              >
                <p><b>Quiz ID:</b> {a.quiz_id}</p>
                <p><b>Score:</b> {a.score}</p>
                <p><b>Time Taken:</b> {a.time_taken_seconds}s</p>
                <p><b>Date:</b> {new Date(a.submitted_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
