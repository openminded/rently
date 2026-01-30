import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { DataTable, type Column } from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:3000/api/users';

export default function UserManagement() {
    const { token } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const payload: any = {};

        formData.forEach((value, key) => payload[key] = value);

        try {
            const url = currentItem ? `${API_URL}/${currentItem.id}` : API_URL;
            const method = currentItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Operation failed');
            }

            setIsModalOpen(false);
            fetchUsers();
            alert(currentItem ? 'User updated' : 'User created');
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            fetchUsers();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const columns: Column<any>[] = [
        { header: 'Name', accessorKey: 'name', sortable: true, className: 'font-medium text-gray-900' },
        { header: 'Username', accessorKey: 'username', sortable: true },
        {
            header: 'Role',
            accessorKey: 'role',
            sortable: true,
            cell: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${row.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' :
                        row.role === 'OWNER' ? 'bg-blue-100 text-blue-700' :
                            row.role === 'SUPERVISOR' ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'}`}>
                    {row.role}
                </span>
            )
        },
        {
            header: 'Created At',
            accessorKey: 'createdAt',
            sortable: true,
            cell: (row) => new Date(row.createdAt).toLocaleDateString()
        }
    ];

    const actions = (row: any) => (
        <div className="flex justify-end gap-2">
            <button
                onClick={() => { setCurrentItem(row); setIsModalOpen(true); }}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                title="Edit User"
            >
                <Edit2 size={16} />
            </button>
            <button
                onClick={() => handleDelete(row.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                title="Delete User"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">Create and manage system access accounts.</p>
                </div>
                <button
                    onClick={() => { setCurrentItem(null); setIsModalOpen(true); }}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
                >
                    <Plus size={18} /> Add User
                </button>
            </div>

            <DataTable
                data={users}
                columns={columns}
                searchKeys={['name', 'username', 'role']}
                actions={actions}
            />

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{currentItem ? 'Edit User' : 'New User'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input type="text" name="name" defaultValue={currentItem?.name} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input type="text" name="username" defaultValue={currentItem?.username} required disabled={!!currentItem} className="w-full p-2 border rounded-lg disabled:bg-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select name="role" defaultValue={currentItem?.role || 'KASIR'} className="w-full p-2 border rounded-lg">
                                    <option value="KASIR">KASIR</option>
                                    <option value="SUPERVISOR">SUPERVISOR</option>
                                    <option value="OWNER">OWNER</option>
                                    <option value="SUPERADMIN">SUPERADMIN</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {currentItem ? 'Reset Password (Optional)' : 'Password'}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required={!currentItem}
                                    placeholder={currentItem ? "Leave empty to keep current" : ""}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
