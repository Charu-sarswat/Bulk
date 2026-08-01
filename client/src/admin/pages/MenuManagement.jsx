import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { exportToCSV } from '../../utils/csvExporter';
import { restaurantConfig } from '../../config/restaurant';
import { Plus, Edit2, Trash2, Check, X, Search, Layers, Image, ToggleLeft, ToggleRight, Gift, FolderOpen, Utensils, Download, UploadCloud, RefreshCw } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';

export default function MenuManagement() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const handleExportSheet = () => {
    const headers = ['Dish Name', 'Category', 'Standard Price (₹)', 'Delivery Price (₹)', 'Type', 'Available'];
    const rows = items.map(i => [
      i.name,
      i.category_name || 'Unassigned',
      i.price,
      i.delivery_price || i.price,
      i.is_veg ? '100% Pure Veg' : 'Non-Veg',
      i.is_available ? 'Available' : 'Sold Out'
    ]);
    exportToCSV('Bombay_Chowpati_Menu_Catalog_Sheet', headers, rows);
  };

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCatFilter]);

  // Category Form States
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catSort, setCatSort] = useState(0);
  const [catImg, setCatImg] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Submit state for forms loading feedback
  const [submitting, setSubmitting] = useState(false);

  // Item Form States
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImg, setItemImg] = useState('');
  const [itemImgUrls, setItemImgUrls] = useState([]);
  const [newImgUrl, setNewImgUrl] = useState('');
  const [itemCatId, setItemCatId] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemIsFeatured, setItemIsFeatured] = useState(false);

  // Industry-Grade Combo & Multi-Category States
  const [isCombo, setIsCombo] = useState(false);
  const [comboItems, setComboItems] = useState([]); // Array of child item IDs
  const [categoryIds, setCategoryIds] = useState([]); // Array of secondary category IDs

  // Custom Variants & Add-ons
  const [variants, setVariants] = useState([]); // Array of {name, price}
  const [addons, setAddons] = useState([]); // Array of {name, price}

  // Raw Materials / Recipe States
  const [rawMaterials, setRawMaterials] = useState([]);
  const [recipe, setRecipe] = useState([]);
  const [tempRawId, setTempRawId] = useState('');
  const [tempRawQty, setTempRawQty] = useState('');

  // Temp states to add one
  const [varName, setVarName] = useState('');
  const [varPrice, setVarPrice] = useState('');
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');

  // Cloudinary image upload state & handler
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileUpload = (e, onSuccess) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (PNG, JPG, WEBP)', 'warning');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      addToast('File size must be under 8MB', 'warning');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result;
        const res = await fetch(`${apiUrl}/api/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64Data, folder: 'bombay_chowpati_catalog' })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          addToast('Image uploaded to Cloudinary successfully!', 'success');
          onSuccess(data.url);
        } else {
          addToast(data.message || 'Cloudinary upload failed', 'error');
        }
      } catch (err) {
        console.error(err);
        addToast('Image upload failed', 'error');
      } finally {
        setUploadingImage(false);
        e.target.value = '';
      }
    };
  };

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      const catRes = await fetch(`${apiUrl}/api/menu/categories`);
      const catData = await catRes.json();
      setCategories(catData);

      const itemsRes = await fetch(`${apiUrl}/api/menu/items`);
      const itemsData = await itemsRes.json();
      setItems(itemsData);

      // Fetch raw materials
      const rawRes = await fetch(`${apiUrl}/api/inventory/raw`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (rawRes.ok) {
        const rawData = await rawRes.json();
        setRawMaterials(rawData);
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading menu database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;
    setSubmitting(true);

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory 
        ? `${apiUrl}/api/menu/categories/${editingCategory.id}`
        : `${apiUrl}/api/menu/categories`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: catName, description: catDesc, sort_order: catSort, image_url: catImg })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error saving category');

      addToast(editingCategory ? `Category "${catName}" updated!` : `Category "${catName}" created!`, 'success');
      setCatName('');
      setCatDesc('');
      setCatSort(0);
      setCatImg('');
      setEditingCategory(null);
      setShowCatForm(false);
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatSort(cat.sort_order || 0);
    setCatImg(cat.image_url || '');
    setShowCatForm(true);
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setCatSort(0);
    setCatImg('');
    setShowCatForm(false);
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? This will delete all its menu items too!`)) return;

    try {
      const response = await fetch(`${apiUrl}/api/menu/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error deleting category');
      addToast(`Category "${name}" deleted.`, 'info');
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Item Handlers
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !itemCatId) {
      addToast('Please fill in required fields', 'warning');
      return;
    }
    setSubmitting(true);

    const payload = {
      category_id: itemCatId,
      name: itemName,
      description: itemDesc,
      price: parseFloat(itemPrice),
      image_url: itemImgUrls[0] || '',
      image_urls: itemImgUrls,
      is_available: itemAvailable,
      is_veg: itemIsVeg,
      is_featured: itemIsFeatured,
      is_combo: isCombo,
      combo_items: comboItems,
      category_ids: categoryIds,
      variants: variants,
      addons: addons,
      recipe: recipe
    };

    try {
      let response;
      if (editingItem) {
        // Edit mode
        response = await fetch(`${apiUrl}/api/menu/items/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create mode
        response = await fetch(`${apiUrl}/api/menu/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error saving item');

      addToast(`Dish "${itemName}" saved successfully!`, 'success');
      resetItemForm();
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description || '');
    setItemPrice(item.price);
    setItemImg(item.image_url || '');
    setItemImgUrls(item.image_urls || (item.image_url ? [item.image_url] : []));
    setItemCatId(item.category_id ? item.category_id.toString() : '');
    setItemAvailable(item.is_available);
    setItemIsVeg(item.is_veg !== undefined ? item.is_veg : true);
    setItemIsFeatured(item.is_featured || false);
    setIsCombo(item.is_combo || false);
    setComboItems(item.combo_items || []);
    setCategoryIds(item.category_ids || []);
    setVariants(item.variants || []);
    setAddons(item.addons || []);
    setRecipe(item.recipe || []);
    setShowItemForm(true);
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemName('');
    setItemDesc('');
    setItemPrice('');
    setItemImg('');
    setItemImgUrls([]);
    setNewImgUrl('');
    setItemCatId('');
    setItemAvailable(true);
    setItemIsVeg(true);
    setItemIsFeatured(false);
    setIsCombo(false);
    setComboItems([]);
    setCategoryIds([]);
    setVariants([]);
    setAddons([]);
    setVarName('');
    setVarPrice('');
    setAddName('');
    setAddPrice('');
    setRecipe([]);
    setTempRawId('');
    setTempRawQty('');
    setShowItemForm(false);
  };

  // Drag and drop handlers for image reordering
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const updatedUrls = [...itemImgUrls];
    const [movedItem] = updatedUrls.splice(sourceIndex, 1);
    updatedUrls.splice(targetIndex, 0, movedItem);
    setItemImgUrls(updatedUrls);
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Delete dish "${name}"?`)) return;

    try {
      const response = await fetch(`${apiUrl}/api/menu/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error deleting item');
      addToast(`Dish "${name}" deleted.`, 'info');
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const toggleItemAvailability = async (item) => {
    const updatedStatus = !item.is_available;
    try {
      const response = await fetch(`${apiUrl}/api/menu/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category_id: item.category_id,
          name: item.name,
          description: item.description,
           price: item.price,
          image_url: item.image_url,
          image_urls: item.image_urls || (item.image_url ? [item.image_url] : []),
          is_available: updatedStatus,
          is_veg: item.is_veg !== undefined ? item.is_veg : true,
          is_combo: item.is_combo,
          combo_items: item.combo_items,
          category_ids: item.category_ids
        })
      });

      if (response.ok) {
        addToast(`"${item.name}" availability updated.`, 'success');
        setItems(prevItems => 
          prevItems.map(i => i.id === item.id ? { ...i, is_available: updatedStatus } : i)
        );
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to update availability status', 'error');
    }
  };

  // Multiple category selection helper
  const handleCategoryCheckboxChange = (catId) => {
    setCategoryIds(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // Combo items selection helper
  const handleComboItemCheckboxChange = (itemId) => {
    setComboItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Filter computations
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check main category or any secondary category
    const matchesCat = selectedCatFilter === 'all' || 
                       item.category_id === selectedCatFilter ||
                       (item.category_ids && item.category_ids.includes(selectedCatFilter));
                       
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return <SkeletonLoader type="menu" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Menu Management" 
        description="Configure your restaurant's digital catalog, categories, and item availability."
        icon={Utensils}
      >
        <button
          onClick={handleExportSheet}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/20 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 text-[#F8A324]" />
          <span>Export Sheet (Excel)</span>
        </button>
        <button
          onClick={() => { resetItemForm(); setShowItemForm(true); }}
          className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold text-xs rounded-xl px-4 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-[#F8A324]/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Menu Item</span>
        </button>
      </PageHeader>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Categories</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">{categories.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Active Dishes</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">{items.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Combo Package Deals</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {items.filter(i => i.is_combo).length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-50 border border-green-100 text-green-700 flex items-center justify-center font-bold shrink-0">
            <span className="font-bold text-xs">100%</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Veg Selection</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {items.length > 0 ? `${Math.round((items.filter(i => i.is_veg).length / items.length) * 100)}%` : '0%'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Category Manager Toggle Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Categories Panel */}
        <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-gold-500" />
              Menu Categories
            </h3>
            <button
              onClick={() => {
                if (editingCategory) {
                  handleCancelCategoryEdit();
                } else {
                  setShowCatForm(!showCatForm);
                }
              }}
              className="bg-gray-100 hover:bg-gold-500 text-gray-700 hover:text-charcoal-900 font-bold p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showCatForm && (
            <form onSubmit={handleSaveCategory} className="space-y-3.5 p-4 border border-gold-100 rounded-xl bg-gold-50/20 mb-4 slide-up">
              <h4 className="text-[10px] font-bold text-gold-600 uppercase tracking-wider block mb-1">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h4>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="E.g., Starters, Signature Pizzas"
                  className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Short description"
                  className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category Image (Cloudinary Upload / URL)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={catImg}
                    onChange={(e) => setCatImg(e.target.value)}
                    placeholder="Paste URL or upload image file..."
                    className="flex-1 text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <label className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 border border-[#F8A324]/30">
                    {uploadingImage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F8A324]" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5 text-[#F8A324]" />
                    )}
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={(e) => handleFileUpload(e, (uploadedUrl) => setCatImg(uploadedUrl))}
                    />
                  </label>
                </div>
                {catImg && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <img src={catImg} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCatImg('')}
                      className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Clear Image
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Sort Order</label>
                  <input
                     type="number"
                     value={catSort}
                     onChange={(e) => setCatSort(parseInt(e.target.value) || 0)}
                     onWheel={(e) => e.target.blur()}
                     className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div className="flex items-end gap-1.5 shrink-0">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="bg-emerald-500 disabled:bg-gray-300 text-white p-2 rounded-lg hover:bg-emerald-600 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    disabled={submitting}
                    onClick={handleCancelCategoryEdit} 
                    className="bg-gray-200 text-gray-500 p-2 rounded-lg hover:bg-gray-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {categories.length === 0 ? (
            <p className="text-gray-400 text-xs py-4 text-center">No categories registered.</p>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">{cat.name}</h4>
                    {cat.description && <p className="text-[10px] text-gray-400 truncate w-32">{cat.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEditCategory(cat)}
                      className="text-gray-400 hover:text-gold-500 transition-colors p-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="text-gray-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu Items Table Panel Container */}
        <div className="lg:col-span-2 bg-white border border-gray-150 rounded-3xl shadow-xs overflow-hidden flex flex-col min-h-[450px]">
          
          {/* Header Controls & Filtering with Padding */}
          <div className="p-4 sm:p-5 border-b border-gray-100 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
              <h3 className="font-bold text-gray-800 text-sm">Dishes Registry</h3>
              <button
                onClick={() => { resetItemForm(); setShowItemForm(true); }}
                className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold text-xs rounded-xl px-4 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-[#F8A324]/30 shrink-0 w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Add Menu Item</span>
              </button>
            </div>

            {/* Filtering */}
            <div className="flex flex-col sm:flex-row gap-3 items-center shrink-0">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search food registries..."
                  className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324] focus:ring-1 focus:ring-[#F8A324]/30"
                />
              </div>
              
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#F8A324] cursor-pointer w-full sm:w-auto"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Add/Edit Modal Layer */}
          {showItemForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={resetItemForm} />
              
              <form onSubmit={handleSaveItem} className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 relative overflow-hidden z-10 space-y-4 max-h-[90vh] overflow-y-auto slide-up">
                <h3 className="font-serif font-bold text-lg text-gray-900 border-b pb-2">
                  {editingItem ? `Edit Dish "${editingItem.name}"` : 'Register New Dish'}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Primary Category *</label>
                    <select
                      required
                      value={itemCatId}
                      onChange={(e) => setItemCatId(e.target.value)}
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Multi Category Selection checklist */}
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 flex items-center gap-1">
                      <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                      Add to Secondary Categories (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-150 max-h-[120px] overflow-y-auto">
                      {categories.filter(cat => cat.id.toString() !== itemCatId).map(cat => (
                        <label key={cat.id} className="flex items-center gap-2 text-xs font-semibold text-gray-600 select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={categoryIds.includes(cat.id)}
                            onChange={() => handleCategoryCheckboxChange(cat.id)}
                            className="w-4 h-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded"
                          />
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Dish Name *</label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="E.g., Ribeye Filet, Matcha Tea"
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Price ({restaurantConfig.currency}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      placeholder="Price"
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Product Photos (Cloudinary Upload / Multiple URLs)</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newImgUrl}
                          onChange={(e) => setNewImgUrl(e.target.value)}
                          placeholder="Paste image URL..."
                          className="flex-1 text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newImgUrl.trim()) {
                              setItemImgUrls([...itemImgUrls, newImgUrl.trim()]);
                              setNewImgUrl('');
                            }
                          }}
                          className="bg-[#3C110D] text-[#F8A324] font-bold px-4 rounded-xl text-xs transition-colors cursor-pointer shrink-0 border border-[#F8A324]/30"
                        >
                          Add URL
                        </button>
                      </div>

                      <label className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border border-[#F8A324]/30">
                        {uploadingImage ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F8A324]" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4 text-[#F8A324]" />
                            <span>Upload File</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingImage}
                          onChange={(e) => handleFileUpload(e, (uploadedUrl) => setItemImgUrls([...itemImgUrls, uploadedUrl]))}
                        />
                      </label>
                    </div>
                    {itemImgUrls.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-gray-400 block font-medium">Drag & drop thumbnails to reorder. The first image will be the primary dish preview.</span>
                        <div className="grid grid-cols-4 gap-2 mt-2 bg-gray-50 p-2 rounded-xl border border-gray-150">
                          {itemImgUrls.map((url, idx) => (
                            <div 
                              key={idx} 
                              draggable
                              onDragStart={(e) => handleDragStart(e, idx)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, idx)}
                              className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-white cursor-grab active:cursor-grabbing hover:border-gold-500 hover:shadow-sm transition-all"
                            >
                              <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover pointer-events-none" />
                              {idx === 0 && (
                                <span className="absolute bottom-0 inset-x-0 bg-gold-500 text-charcoal-900 text-[8px] font-extrabold text-center py-0.5 pointer-events-none select-none uppercase tracking-wide">
                                  Primary
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setItemImgUrls(itemImgUrls.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600 opacity-90 transition-opacity"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Description (Ingredients & cooking)</label>
                    <textarea
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      placeholder="Ingredients, preparation notes, allergen advice..."
                      rows="2"
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500 resize-none"
                    />
                  </div>

                  {/* Combo Meal configuration checklist */}
                  <div className="col-span-2 border-t border-gray-100 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                      <input
                        type="checkbox"
                        checked={isCombo}
                        onChange={(e) => setIsCombo(e.target.checked)}
                        className="w-4.5 h-4.5 text-gold-500 focus:ring-gold-500 border-gray-300 rounded"
                      />
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-gold-500" />
                        This is a Combo Package / Meal Deal (Includes other dishes)
                      </span>
                    </label>

                    {isCombo && (
                      <div className="space-y-2 bg-gold-50/20 p-3 rounded-xl border border-gold-100">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Select included combo items</span>
                        <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {items.filter(i => i.id !== editingItem?.id && !i.is_combo).map(i => (
                            <label key={i.id} className="flex items-center justify-between p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-150">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={comboItems.includes(i.id)}
                                  onChange={() => handleComboItemCheckboxChange(i.id)}
                                  className="w-4 h-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded"
                                />
                                <span className="text-xs font-semibold text-gray-700">{i.name}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-bold">{restaurantConfig.currency}{parseFloat(i.price).toFixed(2)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Variants & Flavors Builder */}
                  <div className="col-span-2 border-t border-gray-100 pt-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Product Variants / Flavors (E.g. Vanilla, Chocolate)</label>
                    
                    {/* Add Variant Form */}
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={varName}
                        onChange={(e) => setVarName(e.target.value)}
                        placeholder="Variant name..."
                        className="flex-1 text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={varPrice}
                        onChange={(e) => setVarPrice(e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Extra Price..."
                        className="w-32 text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!varName) return;
                          setVariants(prev => [...prev, { name: varName, price: parseFloat(varPrice) || 0 }]);
                          setVarName('');
                          setVarPrice('');
                        }}
                        className="bg-gold-500 hover:bg-gold-600 text-charcoal-900 font-bold px-4 rounded-xl text-xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {/* Variant list tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {variants.map((v, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-150 rounded-lg px-2.5 py-1 text-[10px] font-bold text-gray-700 flex items-center gap-1.5">
                          <span>{v.name} ({restaurantConfig.currency}{v.price.toFixed(2)})</span>
                          <button
                            type="button"
                            onClick={() => setVariants(prev => prev.filter((_, i) => i !== idx))}
                            className="text-gray-400 hover:text-red-500 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add-ons Builder */}
                  <div className="col-span-2 border-t border-gray-100 pt-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Product Add-ons (E.g. Extra Cheese, Olives)</label>
                    
                    {/* Add Addon Form */}
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        placeholder="Add-on name..."
                        className="flex-1 text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={addPrice}
                        onChange={(e) => setAddPrice(e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Extra Price..."
                        className="w-32 text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!addName) return;
                          setAddons(prev => [...prev, { name: addName, price: parseFloat(addPrice) || 0 }]);
                          setAddName('');
                          setAddPrice('');
                        }}
                        className="bg-gold-500 hover:bg-gold-600 text-charcoal-900 font-bold px-4 rounded-xl text-xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {/* Addon list tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {addons.map((a, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-150 rounded-lg px-2.5 py-1 text-[10px] font-bold text-gray-700 flex items-center gap-1.5">
                          <span>{a.name} ({restaurantConfig.currency}{a.price.toFixed(2)})</span>
                          <button
                            type="button"
                            onClick={() => setAddons(prev => prev.filter((_, i) => i !== idx))}
                            className="text-gray-400 hover:text-red-500 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recipe / Ingredients Builder */}
                  <div className="col-span-2 border-t border-gray-100 pt-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Recipe / Linked Raw Materials (BOM)</label>
                    
                    {/* Add Ingredient Form */}
                    <div className="flex gap-2 mb-2">
                      <select
                        value={tempRawId}
                        onChange={(e) => setTempRawId(e.target.value)}
                        className="flex-1 text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                      >
                        <option value="">Select Raw Ingredient...</option>
                        {rawMaterials.map(mat => (
                          <option key={mat._id || mat.id} value={mat._id || mat.id}>
                            {mat.name} ({mat.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={tempRawQty}
                        onChange={(e) => setTempRawQty(e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Qty required..."
                        className="w-32 text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!tempRawId || !tempRawQty) return;
                          // Avoid duplicates
                          if (recipe.some(r => r.raw_material_id === tempRawId)) {
                            addToast('Material already added to recipe', 'warning');
                            return;
                          }
                          setRecipe(prev => [...prev, { 
                            raw_material_id: tempRawId, 
                            quantity_required: parseFloat(tempRawQty) || 1 
                          }]);
                          setTempRawId('');
                          setTempRawQty('');
                        }}
                        className="bg-gold-500 hover:bg-gold-600 text-charcoal-900 font-bold px-4 rounded-xl text-xs cursor-pointer"
                      >
                        Link
                      </button>
                    </div>

                    {/* Recipe item list tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.map((r, idx) => {
                        const mat = rawMaterials.find(m => (m._id || m.id) === r.raw_material_id);
                        return (
                          <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-gray-700 flex items-center gap-1.5">
                            <span>{mat ? mat.name : 'Unknown Raw Material'} ({r.quantity_required} {mat ? mat.unit : ''})</span>
                            <button
                              type="button"
                              onClick={() => setRecipe(prev => prev.filter((_, i) => i !== idx))}
                              className="text-gray-400 hover:text-red-500 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="col-span-2 flex flex-wrap items-center gap-4 py-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={itemIsVeg}
                        onChange={(e) => setItemIsVeg(e.target.checked)}
                        className="w-4.5 h-4.5 border-gray-300 rounded focus:ring-emerald-500 text-emerald-600"
                      />
                      <span className="text-xs text-gray-700 font-bold">Vegetarian (Veg)</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={itemAvailable}
                        onChange={(e) => setItemAvailable(e.target.checked)}
                        className="w-4.5 h-4.5 border-gray-300 rounded focus:ring-gold-500 text-gold-500"
                      />
                      <span className="text-xs text-gray-700 font-bold">In Stock / Available</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={itemIsFeatured}
                        onChange={(e) => setItemIsFeatured(e.target.checked)}
                        className="w-4.5 h-4.5 border-gray-300 rounded focus:ring-amber-500 text-amber-500"
                      />
                      <span className="text-xs text-gray-700 font-bold text-amber-600 flex items-center gap-1">★ Featured / Special</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={resetItemForm}
                    className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gold-500 hover:bg-gold-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-charcoal-900 font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {submitting ? 'Saving...' : 'Save Dish'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Items Registry List */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-16 font-medium">No dishes match filter query.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[600px] w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Dish Item</th>
                      <th className="py-3.5 px-4 sm:px-6">Category</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Price</th>
                      <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
                    {filteredItems
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map((item) => (
                      <tr key={item.id} className="hover:bg-[#FFF9EE]/20 transition-colors">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3 min-w-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-200 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 border border-gray-200">
                                <Utensils className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full flex items-center justify-center border ${item.is_veg ? 'border-emerald-600' : 'border-red-600'} shrink-0`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                                </span>
                                <span className="font-serif font-black text-sm text-gray-900 truncate block">{item.name}</span>
                                {item.is_combo && (
                                  <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5">
                                    <Gift className="w-2.5 h-2.5" />
                                    Combo
                                  </span>
                                )}
                              </div>
                              {item.description && <span className="text-[10px] text-gray-400 font-light truncate block mt-0.5 max-w-[200px]">{item.description}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                            {item.category_name}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right font-bold text-[#691F1A] text-sm">
                          {restaurantConfig.currency}{parseFloat(item.price).toFixed(2)}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <button
                            onClick={() => toggleItemAvailability(item)}
                            className="text-gray-400 hover:text-gray-700 transition-colors mx-auto block"
                          >
                            {item.is_available ? (
                              <ToggleRight className="w-6.5 h-6.5 text-emerald-500 fill-emerald-100" />
                            ) : (
                              <ToggleLeft className="w-6.5 h-6.5 text-gray-300" />
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="bg-gray-50 hover:bg-gray-100 border border-gray-200/60 p-2 rounded-lg transition-colors cursor-pointer text-gray-500"
                              title="Edit Dish"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="bg-gray-50 hover:bg-rose-50 border border-gray-200/60 hover:border-rose-100 p-2 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-rose-500"
                              title="Delete Dish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Footer with Padding */}
          <div className="px-4 sm:px-6 py-3.5 border-t border-gray-100 bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredItems.length / pageSize)}
              totalItems={filteredItems.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              pageSizeOptions={[5, 10, 20, 50]}
              onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
