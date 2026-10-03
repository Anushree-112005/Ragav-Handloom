import React, { useState, useEffect } from 'react';
import { Factory, Plus, Edit2, Trash2, MapPin, Phone, Mail, Settings2, Users } from 'lucide-react';
import { plantService } from '../../services/adminServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import UserManagementHeader from '../../components/common/UserManagementHeader';

export default function PlantsPage() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    manager_name: '',
    contact_phone: '',
    email: '',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchPlants = async () => {
    setLoading(true);
    try {
      const data = await plantService.getPlants();
      setPlants(data);
    } catch (err) {
      toast.error('Failed to load manufacturing plants: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlant(null);
    setFormData({
      code: `PLANT-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      location: '',
      manager_name: '',
      contact_phone: '',
      email: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPlant(p);
    setFormData({
      code: p.code,
      name: p.name,
      location: p.location,
      manager_name: p.manager_name || '',
      contact_phone: p.contact_phone || '',
      email: p.email || '',
      status: p.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.location) {
      toast.error('Plant code, name and location are required');
      return;
    }
    setSaveLoading(true);
    try {
      if (editingPlant) {
        await plantService.updatePlant(editingPlant.id, formData);
        toast.success(`Plant '${formData.name}' updated.`);
      } else {
        await plantService.createPlant(formData);
        toast.success(`Plant '${formData.name}' created.`);
      }
      setModalOpen(false);
      fetchPlants();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!plantToDelete) return;
    setSaveLoading(true);
    try {
      await plantService.deletePlant(plantToDelete.id);
      toast.success(`Plant '${plantToDelete.name}' deactivated.`);
      setDeleteDialogOpen(false);
      fetchPlants();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const columns = [
    { header: 'Unit Code', width: 'w-32' },
    { header: 'Plant / Facility Name', width: 'w-64' },
    { header: 'Location / Address', width: 'w-64' },
    { header: 'Unit Manager', width: 'w-48' },
    { header: 'Active Looms', width: 'w-28' },
    { header: 'Assigned Users', width: 'w-32' },
    { header: 'Status', width: 'w-28' },
    { header: 'Actions', width: 'w-28', align: 'right' },
  ];

  return (
    <div className="space-y-6">
      {/* Unified User Management Header & Tabs */}
      <UserManagementHeader
        title="Plant & Unit Access"
        subtitle="Configure weaving sheds, spinning mills, dyeing plants, and user site permissions."
      >
        <Button variant="primary" size="md" icon={Plus} onClick={handleOpenCreate}>
          Add Manufacturing Unit
        </Button>
      </UserManagementHeader>

      {loading ? (
        <LoadingSkeleton type="table" rows={4} />
      ) : (
        <Table columns={columns}>
          {plants.map((p) => (
            <tr key={p.id} className="table-row-hover">
              <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-950">
                {p.code}
              </td>
              <td className="py-3.5 px-4">
                <p className="font-bold text-linen-900 text-xs">{p.name}</p>
                {p.email && <p className="text-[11px] text-linen-400 mt-0.5">{p.email}</p>}
              </td>
              <td className="py-3.5 px-4 text-xs text-linen-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-linen-400 shrink-0" />
                  <span className="truncate">{p.location}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-xs font-semibold text-linen-800">
                {p.manager_name || 'Unassigned'}
              </td>
              <td className="py-3.5 px-4 text-xs font-bold text-teal-800">
                {p.active_looms} Running
              </td>
              <td className="py-3.5 px-4 text-xs font-bold text-indigo-900">
                {p.assigned_users_count} Users
              </td>
              <td className="py-3.5 px-4">
                <StatusBadge status={p.status} size="sm" />
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-lg text-linen-400 hover:text-indigo-900 hover:bg-linen-100"
                    title="Edit Plant"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setPlantToDelete(p);
                      setDeleteDialogOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-linen-400 hover:text-coral-600 hover:bg-coral-50"
                    title="Deactivate Plant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlant ? `Edit Plant: ${editingPlant.name}` : 'Create Manufacturing Unit'}
        subtitle="Specify plant facility location, manager details and communication endpoints."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Plant Code"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g. PLANT-ERD"
          />
          <Input
            label="Plant Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Erode Weaving Cluster"
          />
          <Input
            label="Location / Full Address"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Perundurai Road, Erode, Tamil Nadu"
          />
          <Input
            label="Unit Plant Manager"
            value={formData.manager_name}
            onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
            placeholder="e.g. Karthik Rajan"
          />
          <Input
            label="Contact Phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            placeholder="+91 98421 11223"
          />
          <Input
            label="Contact Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="erode.plant@loomora.com"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-linen-100">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saveLoading}>
              Save Plant
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deactivate Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Deactivate Plant"
        message={`Are you sure you want to deactivate '${plantToDelete?.name}'?`}
        type="danger"
        loading={saveLoading}
      />
    </div>
  );
}
