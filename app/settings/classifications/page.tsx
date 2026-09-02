'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  getClassificationsWithUsage,
  createClassification,
  updateClassification,
  deleteClassification,
  transferClassification,
  mergeClassifications,
} from '@/app/transaction/services/cashoutsService'
import type { Classification } from '@/lib/types/database'
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  ArrowRightLeft,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Layers,
  Lightbulb,
  Wifi,
  Coffee,
  Wrench,
  Store,
  Truck,
  Briefcase,
  ShieldCheck,
  User,
  DollarSign,
  Zap,
  Heart,
  Home,
  Package,
  Droplet,
  Flame,
  Car,
  Hammer,
  Scissors,
  Smartphone,
  ChevronLeft,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

// Shared Icon Map
export const ICON_MAP: Record<string, React.ReactNode> = {
  Lightbulb: <Lightbulb size={20} />,
  Wifi: <Wifi size={20} />,
  Coffee: <Coffee size={20} />,
  Wrench: <Wrench size={20} />,
  Store: <Store size={20} />,
  Truck: <Truck size={20} />,
  Briefcase: <Briefcase size={20} />,
  ShieldCheck: <ShieldCheck size={20} />,
  User: <User size={20} />,
  DollarSign: <DollarSign size={20} />,
  Zap: <Zap size={20} />,
  Heart: <Heart size={20} />,
  Home: <Home size={20} />,
  Package: <Package size={20} />,
  Droplet: <Droplet size={20} />,
  Flame: <Flame size={20} />,
  Car: <Car size={20} />,
  Hammer: <Hammer size={20} />,
  Scissors: <Scissors size={20} />,
  Smartphone: <Smartphone size={20} />,
}

const ICON_KEYS = Object.keys(ICON_MAP)

interface CategoryWithUsage extends Classification {
  usage_count: number
}

export default function ExpenseCategoriesPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithUsage | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<CategoryWithUsage | null>(null)
  const [transferTargetId, setTransferTargetId] = useState('')
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)
  const [mergeSourceId, setMergeSourceId] = useState('')
  const [mergeTargetId, setMergeTargetId] = useState('')

  // Form State
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('Store')
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch Classifications with usage
  const {
    data: categories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-classifications-usage'],
    queryFn: () => getClassificationsWithUsage(supabase),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: ({ name, icon }: { name: string; icon: string }) =>
      createClassification(supabase, name, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classifications-usage'] })
      queryClient.invalidateQueries({ queryKey: ['classifications'] })
      queryClient.invalidateQueries({ queryKey: ['global-subcategories'] })
      setIsAddModalOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create category')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name, icon }: { id: string; name: string; icon: string }) =>
      updateClassification(supabase, id, name, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classifications-usage'] })
      queryClient.invalidateQueries({ queryKey: ['classifications'] })
      queryClient.invalidateQueries({ queryKey: ['global-subcategories'] })
      setEditingCategory(null)
      resetForm()
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update category')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClassification(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classifications-usage'] })
      queryClient.invalidateQueries({ queryKey: ['classifications'] })
      queryClient.invalidateQueries({ queryKey: ['global-subcategories'] })
      setDeletingCategory(null)
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete category')
    },
  })

  const transferMutation = useMutation({
    mutationFn: ({ fromId, toId }: { fromId: string; toId: string }) =>
      transferClassification(supabase, fromId, toId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classifications-usage'] })
      queryClient.invalidateQueries({ queryKey: ['classifications'] })
      queryClient.invalidateQueries({ queryKey: ['global-subcategories'] })
      queryClient.invalidateQueries({ queryKey: ['cashouts'] })
      setDeletingCategory(null)
      setTransferTargetId('')
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to transfer and delete category')
    },
  })

  const mergeMutation = useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) =>
      mergeClassifications(supabase, sourceId, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classifications-usage'] })
      queryClient.invalidateQueries({ queryKey: ['classifications'] })
      queryClient.invalidateQueries({ queryKey: ['global-subcategories'] })
      queryClient.invalidateQueries({ queryKey: ['cashouts'] })
      setIsMergeModalOpen(false)
      setMergeSourceId('')
      setMergeTargetId('')
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to merge categories')
    },
  })

  const resetForm = () => {
    setFormName('')
    setFormIcon('Store')
    setFormError(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (cat: CategoryWithUsage) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormIcon(cat.icon || 'Store')
    setFormError(null)
  }

  const handleSaveAdd = () => {
    if (!formName.trim()) {
      setFormError('Please enter a category name')
      return
    }
    createMutation.mutate({ name: formName, icon: formIcon })
  }

  const handleSaveEdit = () => {
    if (!editingCategory || !formName.trim()) {
      setFormError('Please enter a category name')
      return
    }
    updateMutation.mutate({ id: editingCategory.id, name: formName, icon: formIcon })
  }

  const handleDeleteClick = (cat: CategoryWithUsage) => {
    setDeletingCategory(cat)
    setTransferTargetId('')
  }

  const handleConfirmDelete = () => {
    if (!deletingCategory) return
    if (deletingCategory.usage_count > 0) {
      if (!transferTargetId) {
        alert('Please select a replacement category to transfer existing expenses to.')
        return
      }
      transferMutation.mutate({
        fromId: deletingCategory.id,
        toId: transferTargetId,
      })
    } else {
      deleteMutation.mutate(deletingCategory.id)
    }
  }

  const handleConfirmMerge = () => {
    if (!mergeSourceId || !mergeTargetId) {
      alert('Please select both a source and target category.')
      return
    }
    if (mergeSourceId === mergeTargetId) {
      alert('Source and target categories cannot be the same.')
      return
    }
    const sourceCat = categories.find((c) => c.id === mergeSourceId)
    const targetCat = categories.find((c) => c.id === mergeTargetId)
    if (
      confirm(
        `Are you sure you want to merge "${sourceCat?.name}" into "${targetCat?.name}"? All existing expense records will be updated to "${targetCat?.name}" and "${sourceCat?.name}" will be deleted.`
      )
    ) {
      mergeMutation.mutate({ sourceId: mergeSourceId, targetId: mergeTargetId })
    }
  }

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(q))
  }, [categories, searchQuery])

  // Summary statistics
  const totalCategories = categories.length
  const totalCategorizedExpenses = useMemo(
    () => categories.reduce((sum, c) => sum + (c.usage_count || 0), 0),
    [categories]
  )
  const activeCategoriesCount = useMemo(
    () => categories.filter((c) => (c.usage_count || 0) > 0).length,
    [categories]
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Link & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/settings"
              className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={16} />
              Settings
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" />
            Expense Categories
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure standardized master expense categories for all your stores. POS cashiers will only be able to select from these categories.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {categories.length > 1 && (
            <button
              onClick={() => {
                setMergeSourceId('')
                setMergeTargetId('')
                setIsMergeModalOpen(true)
              }}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors shadow-sm"
            >
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              Merge Categories
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Categories
            </p>
            <p className="text-2xl font-bold text-foreground">{totalCategories}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              In Active Use
            </p>
            <p className="text-2xl font-bold text-foreground">
              {activeCategoriesCount}{' '}
              <span className="text-xs text-muted-foreground font-normal">
                ({totalCategories > 0 ? Math.round((activeCategoriesCount / totalCategories) * 100) : 0}%)
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Categorized Records
            </p>
            <p className="text-2xl font-bold text-foreground">{totalCategorizedExpenses}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-muted/20"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center border border-destructive/20 bg-destructive/5 rounded-xl text-destructive">
          Failed to load categories. Please try again.
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-base font-semibold text-foreground">
            {searchQuery ? `No categories match "${searchQuery}"` : 'No categories created yet'}
          </p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchQuery
              ? 'Try a different search term or add a new category.'
              : 'Create your first standardized expense category to get started.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                    {ICON_MAP[cat.icon || 'Store'] || <Store size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{cat.name}</h3>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-medium mt-0.5 rounded-md px-1.5 py-0.5',
                        cat.usage_count > 0
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      )}
                    >
                      {cat.usage_count > 0
                        ? `${cat.usage_count} ${cat.usage_count === 1 ? 'record' : 'records'}`
                        : 'Unused'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(cat)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground pt-2 border-t border-border flex items-center justify-between">
                <span>Icon: {cat.icon || 'Store'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD / EDIT CATEGORY MODAL --- */}
      {(isAddModalOpen || editingCategory) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                {editingCategory ? 'Edit Category' : 'New Expense Category'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setEditingCategory(null)
                  resetForm()
                }}
                className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value)
                    setFormError(null)
                  }}
                  placeholder="e.g. Utilities, Salaries, Store Rent..."
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Select Icon
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 bg-muted/20 rounded-xl border border-border max-h-48 overflow-y-auto">
                  {ICON_KEYS.map((key) => {
                    const isSelected = formIcon === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormIcon(key)}
                        className={cn(
                          'p-2.5 rounded-lg flex items-center justify-center transition-all',
                          isSelected
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 scale-105 shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                        title={key}
                      >
                        {ICON_MAP[key]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setEditingCategory(null)
                  resetForm()
                }}
                className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-card transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={editingCategory ? handleSaveEdit : handleSaveAdd}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Save size={16} />
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingCategory
                  ? 'Save Changes'
                  : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CATEGORY MODAL --- */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Delete Category</h3>
                  <p className="text-xs text-muted-foreground">
                    &quot;{deletingCategory.name}&quot;
                  </p>
                </div>
              </div>

              {deletingCategory.usage_count > 0 ? (
                <div className="space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-amber-600 dark:text-amber-400 text-xs leading-relaxed">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <strong>Category in Use:</strong> There are{' '}
                      <span className="font-bold">{deletingCategory.usage_count}</span> recorded{' '}
                      {deletingCategory.usage_count === 1 ? 'expense' : 'expenses'} associated with
                      this category. Please select a replacement category to transfer them before
                      deleting.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Transfer transactions to:
                    </label>
                    <select
                      value={transferTargetId}
                      onChange={(e) => setTransferTargetId(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select replacement category...</option>
                      {categories
                        .filter((c) => c.id !== deletingCategory.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this category? This action cannot be undone.
                </p>
              )}
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-card transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={
                  deleteMutation.isPending ||
                  transferMutation.isPending ||
                  (deletingCategory.usage_count > 0 && !transferTargetId)
                }
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={16} />
                {deleteMutation.isPending || transferMutation.isPending
                  ? 'Deleting...'
                  : deletingCategory.usage_count > 0
                  ? 'Transfer & Delete'
                  : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MERGE CATEGORIES MODAL --- */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                Merge Categories
              </h2>
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                Consolidate duplicate categories into one. All historical expense records from the source category will be transferred to the target category, and the source category will be removed.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Source (to remove)
                  </label>
                  <select
                    value={mergeSourceId}
                    onChange={(e) => setMergeSourceId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select source category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.id === mergeTargetId}>
                        {c.name} ({c.usage_count} records)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Target (to keep)
                  </label>
                  <select
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select destination category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.id === mergeSourceId}>
                        {c.name} ({c.usage_count} records)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {mergeSourceId && mergeTargetId && (
                <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-xl flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  <span>
                    Will transfer all expenses from{' '}
                    <strong>{categories.find((c) => c.id === mergeSourceId)?.name}</strong> to{' '}
                    <strong>{categories.find((c) => c.id === mergeTargetId)?.name}</strong>.
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-card transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMerge}
                disabled={!mergeSourceId || !mergeTargetId || mergeMutation.isPending}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                <ArrowRightLeft size={16} />
                {mergeMutation.isPending ? 'Merging...' : 'Confirm Merge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
