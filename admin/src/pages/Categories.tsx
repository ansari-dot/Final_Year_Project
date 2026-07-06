import { useState, useEffect } from 'react';
import { Plus, Edit2, X, Check, AlertCircle, Loader2, Tag, Eye, EyeOff, Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

interface Category {
  id: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function Categories() {
  const { apiCall } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Dropdown menu state
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/categories?all=true', 'GET');
      if (res && res.success && res.data) {
        setCategories(res.data);
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load categories', 'error');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFormError('Image size must be less than 10MB');
        return;
      }

      setFormError('');
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setImageFile(null);
    setImagePreview(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setImageFile(null);
    setImagePreview(category.iconUrl);
    setName(category.name);
    setDescription(category.description || '');
    setIsActive(category.isActive);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    setEditingCategory(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!name.trim()) {
      setFormError('Category name is required');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      if (imageFile) formData.append('icon', imageFile);
      formData.append('name', name.trim());
      formData.append('description', description.trim() || '');
      formData.append('isActive', isActive ? 'true' : 'false');

      const url = editingCategory ? `/categories/${editingCategory.id}` : '/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await apiCall(url, method, formData, true);

      if (res && res.success) {
        showToast(
          editingCategory ? 'Category updated successfully!' : 'Category created successfully!',
          'success'
        );
        setShowModal(false);
        await fetchCategories();
      } else {
        const errorMsg = res?.message || 'Failed to save category';
        setFormError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save category';
      setFormError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      const payload = {
        name: category.name,
        isActive: !category.isActive,
      };

      const res = await apiCall(`/categories/${category.id}`, 'PUT', payload);
      if (res && res.success) {
        showToast(
          category.isActive ? 'Category deactivated' : 'Category activated',
          'success'
        );
        await fetchCategories();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update category', 'error');
    }
  };

  const handleDeactivate = async (category: Category) => {
    if (!window.confirm(`Deactivate category "${category.name}"?\n\nItems in this category will still exist but users won't be able to browse by this category.`)) {
      return;
    }

    try {
      const res = await apiCall(`/categories/${category.id}/deactivate`, 'PATCH');
      if (res && res.success) {
        showToast('Category deactivated successfully!', 'success');
        setOpenDropdown(null);
        await fetchCategories();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate category', 'error');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`⚠️ PERMANENTLY DELETE "${category.name}"?\n\nThis action CANNOT be undone!\n\nThe category will be removed from the database permanently.\n\nNote: You cannot delete categories that have active items.`)) {
      return;
    }

    try {
      const res = await apiCall(`/categories/${category.id}`, 'DELETE');
      if (res && res.success) {
        showToast('Category deleted permanently!', 'success');
        setOpenDropdown(null);
        await fetchCategories();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 size={40} className="animate-spin text-primary/40 mb-4" />
        <p className="text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-headings text-3xl font-bold text-primary">Categories</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Manage product categories. Active categories appear in browse and filter options.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-sm hover:shadow-md"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Stats Bar */}
      {categories.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-primary">{categories.length}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Categories</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">
              {categories.filter(c => c.isActive).length}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Active</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-600">
              {categories.reduce((sum, c) => sum + (c.itemCount || 0), 0)}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Items</div>
          </div>
        </div>
      )}

      {/* Categories List */}
      {categories.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className={`hover:bg-gray-50 transition-colors ${!category.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {category.iconUrl ? (
                        <img src={category.iconUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Tag size={20} className="text-primary" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-primary">{category.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description || <span className="italic text-gray-400">No description</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                      {category.itemCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {category.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-green-100 text-green-800 rounded-full font-semibold">
                        <Eye size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-200 text-gray-600 rounded-full font-semibold">
                        <EyeOff size={12} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => toggleActive(category)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={category.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {category.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      
                      {/* More Actions Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === category.id ? null : category.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="More actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {openDropdown === category.id && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenDropdown(null)}
                            />
                            
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20 py-1">
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  handleDeactivate(category);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                              >
                                <EyeOff size={14} />
                                Deactivate
                              </button>
                              <div className="border-t my-1" />
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  handleDelete(category);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium"
                              >
                                <Trash2 size={14} />
                                Delete Permanently
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Tag size={28} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">No Categories Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first category to organize clothing items.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-semibold"
          >
            <Plus size={18} />
            Create First Category
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-headings text-3xl font-bold text-primary">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {editingCategory ? 'Update category information' : 'Create a new product category'}
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="p-2.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - Form */}
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 space-y-4">
                {/* Error Alert */}
                {formError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">{formError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormError('')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Row 1: Category Icon Upload and Preview */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category Icon Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category Icon <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                      id="category-icon"
                      disabled={submitting}
                    />
                    <label
                      htmlFor="category-icon"
                      className="block w-full px-3 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary cursor-pointer transition-colors bg-gray-50"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                          <Tag size={20} className="text-primary" />
                        </div>
                        <p className="text-xs font-medium text-gray-700">
                          {imageFile ? 'Image Selected' : 'Click to upload'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG or WebP (max 10MB)
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Image Preview */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preview
                    </label>
                    <div className="w-full h-[120px] border-2 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {imageFile && (
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(editingCategory?.iconUrl || null);
                              }}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No image uploaded</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 2: Category Name and Active Status */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitting}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      placeholder="e.g., T-Shirts, Jeans, Dresses"
                      maxLength={100}
                      required
                    />
                  </div>

                  {/* Active Toggle */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center justify-between h-[42px] px-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-700">Show this category to users</p>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          disabled={submitting}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Row 3: Description (Full Width) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={submitting}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                    placeholder="Brief description of this category"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
