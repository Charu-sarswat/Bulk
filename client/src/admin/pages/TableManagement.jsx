import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, Printer, Users, Compass, Check, X, LayoutGrid, Table, ExternalLink } from 'lucide-react';
import { restaurantConfig } from '../../config/restaurant';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';

export default function TableManagement() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & View Mode
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  React.useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchTables = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/tables`);
      const data = await response.json();
      setTables(data);
    } catch (err) {
      console.error(err);
      addToast('Error fetching tables from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!tableNumber) return;

    try {
      const response = await fetch(`${apiUrl}/api/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ table_number: tableNumber, capacity })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error creating table');

      addToast(`Table "${tableNumber}" added!`, 'success');
      setTableNumber('');
      setCapacity(4);
      setShowForm(false);
      fetchTables();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteTable = async (id, tableNumber) => {
    if (!window.confirm(`Delete table "${tableNumber}"? This will disable its scanning link!`)) return;

    try {
      const response = await fetch(`${apiUrl}/api/tables/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error deleting table');
      addToast(`Table "${tableNumber}" removed`, 'info');
      fetchTables();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Printable QR Card Generator pop-up
  const handlePrintQR = (table) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - Table ${table.table_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #ffffff;
              color: #1b1c23;
              text-align: center;
            }
            .card {
              border: 5px double #d4af37;
              padding: 50px 40px;
              border-radius: 24px;
              max-width: 320px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.03);
              background: #fff;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .logo {
              font-size: 28px;
              font-weight: 800;
              letter-spacing: 3px;
              color: #1b1c23;
              margin-bottom: 2px;
            }
            .logo span {
              color: #d4af37;
            }
            .subtitle {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #a0aec0;
              margin-bottom: 30px;
              font-weight: 600;
            }
            .qr-image {
              width: 220px;
              height: 220px;
              border: 1px solid #edf2f7;
              padding: 10px;
              background: #fff;
              border-radius: 16px;
            }
            .table-badge {
              font-size: 34px;
              font-weight: 800;
              margin: 25px 0 10px 0;
              color: #1b1c23;
              letter-spacing: 1px;
            }
            .instructions {
              font-size: 12px;
              color: #4a5568;
              line-height: 1.6;
              margin-top: 10px;
              max-width: 260px;
            }
            .instructions strong {
              color: #d4af37;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">${restaurantConfig.logoText}<span>.</span></div>
            <div class="subtitle">${restaurantConfig.tagline}</div>
            <img class="qr-image" src="${table.qr_code_url}" alt="QR Table ${table.table_number}"/>
            <div class="table-badge">TABLE ${table.table_number}</div>
            <div class="instructions">
              Scan the QR code to browse our <strong>digital menu</strong> and place orders directly from your phone.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return <SkeletonLoader type="table" />;
  }

  const filteredTables = tables.filter(table => 
    table.table_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.capacity.toString().includes(searchQuery)
  );

  const paginatedTables = filteredTables.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-8">
      
      {/* Upper header */}
      <PageHeader
        title="Table Seating & QR Codes"
        description="Manage physical seats, generate codes, and print table cards."
        icon={Compass}
      >
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold text-xs rounded-xl px-4 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-[#F8A324]/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Table</span>
        </button>
      </PageHeader>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Cataloged Tables</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">{tables.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Seating Capacity</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {tables.reduce((sum, t) => sum + parseInt(t.capacity || 0), 0)} Guests
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Printer className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">QR Print Cards</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">{tables.length} Codes</div>
          </div>
        </div>
      </div>

      {/* Add Form popover */}
      {showForm && (
        <form onSubmit={handleAddTable} className="bg-white border p-6 rounded-2xl max-w-md shadow-md space-y-4 border-gold-100 slide-up">
          <h4 className="font-serif font-bold text-sm text-gray-800">Configure Seating Table</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Table Code/Number *</label>
              <input
                type="text"
                required
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="E.g., T-1, VIP-2"
                className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Seating Capacity</label>
              <input
                type="number"
                required
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 2)}
                className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-500 font-bold py-2 px-4 rounded-xl text-xs hover:bg-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gold-500 text-charcoal-900 font-bold py-2 px-4 rounded-xl text-xs hover:bg-gold-600 cursor-pointer"
            >
              Save Table
            </button>
          </div>
        </form>
      )}

      {/* Single Unified Edge-to-Edge Table Panel Card Container */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {/* Search Bar & Table List Controls Header with Padding */}
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tables by number or capacity..."
                className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324] focus:ring-1 focus:ring-[#F8A324]/30"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => { setViewMode('grid'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-initial justify-center ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid Card View</span>
              </button>
              <button
                type="button"
                onClick={() => { setViewMode('table'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-initial justify-center ${
                  viewMode === 'table'
                    ? 'bg-white text-[#691F1A] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tables Display */}
        {tables.length === 0 ? (
          <div className="text-center py-16 border border-gray-100 rounded-2xl max-w-sm mx-auto my-6">
            <Compass className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <h4 className="font-bold text-gray-750">No tables cataloged</h4>
            <p className="text-xs text-gray-400 mt-1">Add tables to start generating print QR sheets.</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-16 font-medium">No tables matching search query.</p>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 p-4 sm:p-6">
            {paginatedTables.map((table) => (
              <div
                key={table.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-sm hover:shadow-md transition-shadow"
              >
                {/* QR Image */}
                <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl mb-4 shrink-0">
                  <img
                    src={table.qr_code_url}
                    alt={`Table ${table.table_number}`}
                    className="w-32 h-32 object-contain"
                  />
                </div>

                {/* Table Info */}
                <div className="mb-4">
                  <h4 className="font-bold text-gray-900 text-base">Table {table.table_number}</h4>
                  <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 font-bold uppercase mt-1">
                    <Users className="w-3.5 h-3.5 text-gray-300" />
                    <span>Max {table.capacity} Guests</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full flex gap-2 pt-2 border-t border-gray-50">
                  <button
                    onClick={() => handlePrintQR(table)}
                    className="flex-1 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Card</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTable(table.id, table.table_number)}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Remove Table"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Table Identifier</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Seating Capacity</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">QR Code URL</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
                {paginatedTables.map((table) => (
                  <tr key={table.id} className="hover:bg-[#FFF9EE]/20 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-bold text-gray-900">
                      Table {table.table_number}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {table.capacity} Guests
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <a
                        href={table.qr_code_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        <span>View QR Code</span>
                      </a>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handlePrintQR(table)}
                          className="px-3 py-1.5 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                          title="Print QR Seating Card"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Card</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id, table.table_number)}
                          className="bg-gray-100 hover:bg-rose-50 border border-gray-200/60 hover:border-rose-100 p-2 rounded-lg text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Remove Table"
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

        {/* Pagination Footer with Padding */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-gray-100 bg-white">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredTables.length / pageSize)}
            totalItems={filteredTables.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            pageSizeOptions={[8, 16, 24, 48]}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
          />
        </div>
      </div>

    </div>
  );
}
