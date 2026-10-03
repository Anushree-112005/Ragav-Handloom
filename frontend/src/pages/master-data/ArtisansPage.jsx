import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit2, Trash2, Search, Filter, Award, Phone, MapPin, Boxes, User } from 'lucide-react';
import { artisanService } from '../../services/masterDataService';
import { departmentService } from '../../services/adminServices';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const SKILL_LEVELS = [
  { value: 'MASTER_WEAVER', label: 'Master Artisan / Guru' },
  { value: 'SENIOR_WEAVER', label: 'Senior Weaver' },
  { value: 'WEAVER', label: 'Skilled Handloom Weaver' },
  { value: 'APPRENTICE', label: 'Apprentice / Shishya' },
];

const SPECIALIZATIONS = [
  { value: 'Pure Zari & Brocade', label: 'Pure Zari & Brocade (Varanasi / Kanchipuram)' },
  { value: 'Double Ikat & Patola', label: 'Double Ikat & Patola (Pochampally / Patan)' },
  { value: 'Korvai Contrast Weave', label: 'Korvai Traditional Contrast Borders' },
  { value: 'Jamdani Extra-Weft', label: 'Jamdani Fine Muslin Weaving' },
  { value: 'Tussar Wild Silk Weave', label: 'Tussar / Tribal Handspun Silk' },
  { value: 'Khadi & Fine Cotton', label: 'Fine Count Handspun Khadi' },
];

export default function ArtisansPage() {
  const [artisans, setArtisans] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingArtisan, setEditingArtisan] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [artisanToDelete, setArtisanToDelete] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    artisan_code: '',
    name: '',
    phone: '',
    location: 'Kanchipuram Cluster',
    skill_level: 'MASTER_WEAVER',
    specialization: 'Korvai Contrast Weave',
    experience_years: 18,
    department_id: '',
    joining_date: '2015-04-10',
    status: 'ACTIVE',
  });

  const toast = useToast();

  const fetchDependencies = async () => {
    try {
      const depts = await departmentService.getDepartments();
      setDepartments(Array.isArray(depts) ? depts : (depts?.items || []));
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const fetchArtisans = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (skillFilter) params.skill_level = skillFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await artisanService.getAll(params);
      setArtisans(Array.isArray(res) ? res : (res?.items || []));
    } catch (err) {
      toast.error('Failed to load artisans: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchArtisans();
  }, [search, skillFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingArtisan(null);
    setFormData({
      artisan_code: `ART-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      phone: '+91 98450 ',
      location: 'Kanchipuram Cluster, Tamil Nadu',
      skill_level: 'MASTER_WEAVER',
      specialization: 'Pure Zari & Brocade',
      experience_years: 15,
      department_id: departments[0]?.id || '',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setEditingArtisan(a);
    setFormData({
      artisan_code: a.artisan_code,
      name: a.name,
      phone: a.phone || '',
      location: a.location || '',
      skill_level: a.skill_level,
      specialization: a.specialization || '',
      experience_years: a.experience_years || 0,
      department_id: a.department_id || '',
      joining_date: a.joining_date || '',
      status: a.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.artisan_code || !formData.name) {
      toast.error('Artisan code and name are required');
      return;
    }
    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        experience_years: parseInt(formData.experience_years, 10) || 0,
        department_id: formData.department_id || null,
      };

      if (editingArtisan) {
        await artisanService.update(editingArtisan.id, payload);
        toast.success(`Artisan '${formData.name}' updated.`);
      } else {
        await artisanService.create(payload);
        toast.success(`Artisan '${formData.name}' registered.`);
      }
      setModalOpen(false);
      fetchArtisans();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!artisanToDelete) return;
    try {
      await artisanService.delete(artisanToDelete.id);
      toast.success(`Artisan '${artisanToDelete.name}' removed.`);
      setDeleteDialogOpen(false);
      fetchArtisans();
    } catch (err) {
      toast.error('Failed to delete artisan: ' + err.message);
    }
  };

  const renderSkillBadge = (level) => {
    switch (level) {
      case 'MASTER_WEAVER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <Award className="w-3 h-3 mr-1 text-amber-500" />
            Master Artisan
          </span>
        );
      case 'SENIOR_WEAVER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
            Senior Weaver
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-surface-800 dark:text-slate-300">
            {level.replace('_', ' ')}
          </span>
        );
    }
  };

  const columns = [
    {
      header: 'Artisan',
      accessor: (a) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200/50 flex-shrink-0">
            {(a.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-surface-900 dark:text-surface-100 block text-sm">
              {a.name}
            </span>
            <span className="font-mono text-xs text-surface-500">{a.artisan_code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Skill & Heritage',
      accessor: (a) => (
        <div className="space-y-1">
          <div>{renderSkillBadge(a.skill_level)}</div>
          <span className="text-[11px] text-surface-600 dark:text-surface-400 block">
            {a.specialization}
          </span>
        </div>
      ),
    },
    {
      header: 'Experience',
      accessor: (a) => (
        <span className="font-mono text-xs font-medium text-surface-800 dark:text-surface-200">
          {a.experience_years} Years
        </span>
      ),
    },
    {
      header: 'Cluster / Contact',
      accessor: (a) => (
        <div>
          <div className="flex items-center space-x-1 text-xs text-surface-700 dark:text-surface-300">
            <MapPin className="w-3 h-3 text-surface-400" />
            <span>{a.location}</span>
          </div>
          {a.phone && (
            <div className="flex items-center space-x-1 text-[11px] text-surface-500 font-mono mt-0.5">
              <Phone className="w-3 h-3 text-surface-400" />
              <span>{a.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Assigned Loom',
      accessor: (a) => (
        <div className="flex items-center space-x-1 text-xs">
          <Boxes className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-mono font-medium text-surface-800 dark:text-surface-200">
            {a.assigned_loom_number || 'Unlinked'}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (a) => <StatusBadge status={a.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (a) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-textile-purple"
            onClick={() => handleOpenEdit(a)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-surface-500 hover:text-rose-600"
            onClick={() => {
              setArtisanToDelete(a);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-cyan-600" />
            Artisans & Weavers Directory
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Maintain master weaver profiles, traditional craft techniques, loom linkages, and weaving guild records.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Artisan
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search artisan name, location, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-50 dark:bg-surface-800 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-border rounded-lg text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          >
            <option value="">All Skill Levels</option>
            {SKILL_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-border rounded-lg text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-textile-purple/30"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table
          columns={columns}
          data={artisans}
          emptyMessage="No artisans found matching the criteria."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingArtisan ? `Edit Artisan: ${editingArtisan.name}` : 'Register Artisan Profile'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Artisan Code *"
              value={formData.artisan_code}
              onChange={(e) => setFormData({ ...formData, artisan_code: e.target.value })}
              required
              placeholder="e.g. ART-KJM-01"
            />
            <Input
              label="Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Master Weave Raghavan K."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Skill Mastery Level *"
              value={formData.skill_level}
              onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
              options={SKILL_LEVELS}
            />
            <Select
              label="Craft Specialization *"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              options={SPECIALIZATIONS}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Experience (Years) *"
              type="number"
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              required
            />
            <Input
              label="Contact Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98450 12345"
            />
            <Input
              label="Weaving Cluster / City *"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              placeholder="e.g. Kanchipuram, TN"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Department Unit"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              options={[
                { value: '', label: 'Select Department...' },
                ...departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
              ]}
            />
            <Input
              label="Joining Date"
              type="date"
              value={formData.joining_date}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'Active (Engaged on Looms)' },
              { value: 'INACTIVE', label: 'Inactive / On Leave' },
            ]}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingArtisan ? 'Save Changes' : 'Register Artisan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Artisan Profile"
        message={`Are you sure you want to remove artisan '${artisanToDelete?.name}' (${artisanToDelete?.artisan_code})?`}
        confirmText="Remove Artisan"
        variant="danger"
      />
    </div>
  );
}
