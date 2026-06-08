'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function PurchaseOrdersPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    supplierId: '', branchId: '',
    items: [{ itemId: '', quantity: '', unitCost: '' }]
  });
  const [receiveData, setReceiveData] = useState({ items: [] });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [o, s, b, i] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/suppliers'),
        api.get('/branches'),
        api.get('/items'),
      ]);
      setOrders(o.data);
      setSuppliers(s.data);
      setBranches(b.data);
      setItems(i.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemId: '', quantity: '', unitCost: '' }]
    });
  };

  const removeItemRow = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItemRow = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchase-orders', {
        supplierId: Number(formData.supplierId),
        branchId: Number(formData.branchId),
        items: formData.items.map(i => ({
          itemId: Number(i.itemId),
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
        }))
      });
      setShowForm(false);
      setFormData({ supplierId: '', branchId: '', items: [{ itemId: '', quantity: '', unitCost: '' }] });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create purchase order');
    }
  };

  const openReceiveForm = (po) => {
    setSelectedPO(po);
    setReceiveData({
      items: po.items?.map(item => ({
        poItemId: item.id,
        receivedQuantity: item.quantity,
        batchNumber: '',
        expiryDate: '',
        itemName: item.item?.name,
      })) || []
    });
    setShowReceiveForm(true);
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/purchase-orders/${selectedPO.id}/receive`, {
        items: receiveData.items.map(i => ({
          poItemId: i.poItemId,
          receivedQuantity: Number(i.receivedQuantity),
          batchNumber: i.batchNumber,
          expiryDate: i.expiryDate || null,
        }))
      });
      setShowReceiveForm(false);
      setSelectedPO(null);
      fetchAll();
    } catch (err) {
      setError('Failed to receive purchase order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-700',
      ORDERED: 'bg-blue-100 text-blue-700',
      PARTIALLY_RECEIVED: 'bg-yellow-100 text-yellow-700',
      RECEIVED: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              ← Dashboard
            </button>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-gray-800">Purchase Orders</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name} — <span className="text-blue-600 font-medium">{user?.role}</span></span>
            <button onClick={logout} className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
            <p className="text-gray-500 text-sm mt-1">Manage procurement and stock receiving</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            + New Purchase Order
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">×</button>
          </div>
        )}

        {/* Create PO Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-800 mb-4">New Purchase Order</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select required value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Select supplier...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receiving Branch</label>
                    <select required value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Select branch...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Items</label>
                    <button type="button" onClick={addItemRow}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100">
                      + Add Item
                    </button>
                  </div>
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                      <select required value={item.itemId}
                        onChange={(e) => updateItemRow(index, 'itemId', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                        <option value="">Select item...</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                      <input required type="number" min="1" placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => updateItemRow(index, 'quantity', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      <div className="flex gap-1">
                        <input required type="number" min="0" placeholder="Unit Cost"
                          value={item.unitCost}
                          onChange={(e) => updateItemRow(index, 'unitCost', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        {index > 0 && (
                          <button type="button" onClick={() => removeItemRow(index)}
                            className="text-red-500 hover:text-red-700 px-2">×</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                    Create PO
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Receive PO Modal */}
        {showReceiveForm && selectedPO && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Receive Purchase Order</h2>
              <p className="text-sm text-gray-500 mb-4">PO #{selectedPO.id} — {selectedPO.supplier?.name}</p>
              <form onSubmit={handleReceive} className="space-y-4">
                {receiveData.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <p className="font-medium text-sm text-gray-800 mb-2">{item.itemName}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Received Qty</label>
                        <input type="number" value={item.receivedQuantity}
                          onChange={(e) => {
                            const updated = [...receiveData.items];
                            updated[index].receivedQuantity = e.target.value;
                            setReceiveData({ items: updated });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm mt-1" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Batch Number</label>
                        <input type="text" value={item.batchNumber}
                          onChange={(e) => {
                            const updated = [...receiveData.items];
                            updated[index].batchNumber = e.target.value;
                            setReceiveData({ items: updated });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm mt-1"
                          placeholder="e.g. BATCH-001" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Expiry Date</label>
                        <input type="date" value={item.expiryDate}
                          onChange={(e) => {
                            const updated = [...receiveData.items];
                            updated[index].expiryDate = e.target.value;
                            setReceiveData({ items: updated });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium">
                    Confirm Receipt
                  </button>
                  <button type="button" onClick={() => { setShowReceiveForm(false); setSelectedPO(null); }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PO Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Branch</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Value</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{order.supplier?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.branch?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.totalValue?.toLocaleString()} RWF
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {order.status !== 'RECEIVED' && (
                          <button onClick={() => openReceiveForm(order)}
                            className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100 transition">
                            Receive
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}