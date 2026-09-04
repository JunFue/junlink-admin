import { SupabaseClient } from '@supabase/supabase-js'
import { FunctionDeclaration, SchemaType } from '@google/generative-ai'

export interface ToolExecutionContext {
  supabase: SupabaseClient
  adminUserId: string
  allowedStoreIds: string[]
}

// Declarations of all tools provided to Gemini
export const junfueToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_business_overview',
    description: 'Retrieves an overview of all accessible stores, branch names, staff counts, and status.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        storeId: {
          type: SchemaType.STRING,
          description: 'Optional store ID to filter by. If omitted, returns all stores accessible to the admin.',
        },
      },
    },
  },
  {
    name: 'get_financial_metrics',
    description: 'Retrieves key financial KPIs (gross sales, net sales, total expenses, net profit, cash remaining, transaction count, average order value) for a specific date range and store.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        startDate: {
          type: SchemaType.STRING,
          description: 'Start date in YYYY-MM-DD format (e.g. 2026-09-01).',
        },
        endDate: {
          type: SchemaType.STRING,
          description: 'End date in YYYY-MM-DD format (e.g. 2026-09-04).',
        },
        storeId: {
          type: SchemaType.STRING,
          description: 'Optional store ID to filter metrics. If omitted, aggregates across all stores.',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'get_sales_trends',
    description: 'Retrieves time-series sales trends (daily or monthly) and category breakdowns.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        startDate: {
          type: SchemaType.STRING,
          description: 'Start date in YYYY-MM-DD format.',
        },
        endDate: {
          type: SchemaType.STRING,
          description: 'End date in YYYY-MM-DD format.',
        },
        storeId: {
          type: SchemaType.STRING,
          description: 'Optional store ID.',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'get_top_and_worst_sellers',
    description: 'Finds top-selling items by revenue/quantity and identifies slow-moving or dead stock items.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        storeId: {
          type: SchemaType.STRING,
          description: 'Optional store ID.',
        },
        startDate: {
          type: SchemaType.STRING,
          description: 'Optional start date in YYYY-MM-DD format.',
        },
        endDate: {
          type: SchemaType.STRING,
          description: 'Optional end date in YYYY-MM-DD format.',
        },
        limit: {
          type: SchemaType.NUMBER,
          description: 'Number of items to return (default: 10).',
        },
      },
    },
  },
  {
    name: 'get_transactions_data',
    description: 'Queries and filters detailed POS transaction logs (by invoice, cashier, amount, date range, or search term).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        search: {
          type: SchemaType.STRING,
          description: 'Search term for item name or invoice number.',
        },
        storeId: {
          type: SchemaType.STRING,
          description: 'Optional store ID.',
        },
        startDate: {
          type: SchemaType.STRING,
          description: 'Start date in YYYY-MM-DD format.',
        },
        endDate: {
          type: SchemaType.STRING,
          description: 'End date in YYYY-MM-DD format.',
        },
        minAmount: {
          type: SchemaType.NUMBER,
          description: 'Filter transactions above this total price.',
        },
        limit: {
          type: SchemaType.NUMBER,
          description: 'Max records to return (default 20, max 50).',
        },
      },
    },
  },
  {
    name: 'detect_anomalies',
    description: 'Audits transaction and expense history for anomalies: excessive discounts (>25%), unusually large expenses, off-hours sales, duplicate rapid transactions, and void discrepancies.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        storeId: {
          type: SchemaType.STRING,
          description: 'Optional store ID.',
        },
        startDate: {
          type: SchemaType.STRING,
          description: 'Start date in YYYY-MM-DD format for anomaly scanning.',
        },
        endDate: {
          type: SchemaType.STRING,
          description: 'End date in YYYY-MM-DD format for anomaly scanning.',
        },
      },
    },
  },
  {
    name: 'get_inventory_status',
    description: 'Inspects inventory levels, low stock warnings, out of stock items, and recent stock movements.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        storeId: {
          type: SchemaType.STRING,
          description: 'Optional store ID.',
        },
        filter: {
          type: SchemaType.STRING,
          description: 'Filter type: "low_stock", "out_of_stock", or "all".',
        },
        limit: {
          type: SchemaType.NUMBER,
          description: 'Number of inventory items to inspect (default 30).',
        },
      },
    },
  },
  {
    name: 'get_expenses_breakdown',
    description: 'Retrieves granular breakdown of business expenses (COGS, OPEX, Remittances) with categories, receipt numbers, and notes.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        startDate: {
          type: SchemaType.STRING,
          description: 'Start date in YYYY-MM-DD format.',
        },
        endDate: {
          type: SchemaType.STRING,
          description: 'End date in YYYY-MM-DD format.',
        },
        storeId: {
          type: SchemaType.STRING,
          description: 'Optional store ID.',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'get_staff_performance',
    description: 'Analyzes staff and cashier performance including total sales generated, transaction counts, and discounts granted.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        storeId: {
          type: SchemaType.STRING,
          description: 'Optional store ID.',
        },
        startDate: {
          type: SchemaType.STRING,
          description: 'Start date in YYYY-MM-DD format.',
        },
        endDate: {
          type: SchemaType.STRING,
          description: 'End date in YYYY-MM-DD format.',
        },
      },
    },
  },
  {
    name: 'get_customer_insights',
    description: 'Retrieves top customer data, VIP spenders, visit frequencies, and recent registrations.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        storeId: {
          type: SchemaType.STRING,
          description: 'Optional store ID.',
        },
        limit: {
          type: SchemaType.NUMBER,
          description: 'Number of top customers to return (default 15).',
        },
      },
    },
  },
]

// Implementations of the tools
export async function executeJunfueTool(
  toolName: string,
  args: Record<string, any>,
  context: ToolExecutionContext
): Promise<any> {
  const { supabase, allowedStoreIds } = context

  if (allowedStoreIds.length === 0) {
    return { error: 'No accessible stores found for this account.' }
  }

  // Helper to validate and narrow down store filter
  const resolveTargetStores = (storeId?: string): string[] => {
    if (storeId && storeId !== 'all' && allowedStoreIds.includes(storeId)) {
      return [storeId]
    }
    return allowedStoreIds
  }

  try {
    switch (toolName) {
      case 'get_business_overview': {
        const targetStores = resolveTargetStores(args.storeId)
        const { data: stores, error: storesErr } = await supabase
          .from('stores')
          .select('store_id, store_name, store_address, enrollment_id, created_at, deleted_at')
          .in('store_id', targetStores)
          .is('deleted_at', null)

        if (storesErr) throw storesErr

        // Fetch staff count per store
        const { data: staffList } = await supabase
          .from('users')
          .select('user_id, store_id, role, first_name, last_name, email')
          .in('store_id', targetStores)
          .is('deleted_at', null)

        // Fetch item count per store
        const { data: itemsList } = await supabase
          .from('items')
          .select('id, store_id')
          .in('store_id', targetStores)

        const summary = (stores || []).map((s) => {
          const storeStaff = (staffList || []).filter((u) => u.store_id === s.store_id)
          const storeItems = (itemsList || []).filter((i) => i.store_id === s.store_id)
          return {
            storeId: s.store_id,
            storeName: s.store_name,
            address: s.store_address,
            staffCount: storeStaff.length,
            staffMembers: storeStaff.map((u) => `${u.first_name || ''} ${u.last_name || ''} (${u.role})`.trim()),
            totalProductsListed: storeItems.length,
          }
        })

        return {
          totalStores: summary.length,
          stores: summary,
        }
      }

      case 'get_financial_metrics': {
        const { startDate, endDate, storeId } = args
        const targetStores = resolveTargetStores(storeId)

        // Query transactions in the period
        const { data: transactions, error: txErr } = await supabase
          .from('transactions')
          .select('id, total_price, discount, sales_price, quantity, store_id, transaction_time')
          .in('store_id', targetStores)
          .gte('transaction_time', `${startDate}T00:00:00`)
          .lte('transaction_time', `${endDate}T23:59:59.999Z`)

        if (txErr) throw txErr

        // Query expenses in the period
        const { data: expenses, error: expErr } = await supabase
          .from('expenses')
          .select('id, amount, cashout_type, store_id, transaction_date')
          .in('store_id', targetStores)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)

        if (expErr) throw expErr

        const totalGrossSales = (transactions || []).reduce((acc, tx) => acc + (Number(tx.total_price) || 0) + (Number(tx.discount) || 0), 0)
        const totalDiscounts = (transactions || []).reduce((acc, tx) => acc + (Number(tx.discount) || 0), 0)
        const totalNetSales = (transactions || []).reduce((acc, tx) => acc + (Number(tx.total_price) || 0), 0)

        const cogsExpenses = (expenses || []).filter((e) => e.cashout_type === 'COGS').reduce((acc, e) => acc + (Number(e.amount) || 0), 0)
        const opexExpenses = (expenses || []).filter((e) => e.cashout_type === 'OPEX').reduce((acc, e) => acc + (Number(e.amount) || 0), 0)
        const remittanceExpenses = (expenses || []).filter((e) => e.cashout_type === 'REMITTANCE').reduce((acc, e) => acc + (Number(e.amount) || 0), 0)
        const totalExpenses = cogsExpenses + opexExpenses + remittanceExpenses

        const grossProfit = totalNetSales - cogsExpenses
        const netProfit = totalNetSales - (cogsExpenses + opexExpenses)
        const availableCash = totalNetSales - totalExpenses
        const transactionCount = (transactions || []).length
        const averageOrderValue = transactionCount > 0 ? totalNetSales / transactionCount : 0

        return {
          period: { startDate, endDate },
          storesAuditedCount: targetStores.length,
          grossSales: totalGrossSales,
          discounts: totalDiscounts,
          netSales: totalNetSales,
          expenses: {
            cogs: cogsExpenses,
            opex: opexExpenses,
            remittance: remittanceExpenses,
            totalExpenses,
          },
          grossProfit,
          netProfit,
          estimatedProfitMarginPercent: totalNetSales > 0 ? Number(((netProfit / totalNetSales) * 100).toFixed(2)) : 0,
          availableCash,
          transactionCount,
          averageOrderValue: Number(averageOrderValue.toFixed(2)),
        }
      }

      case 'get_sales_trends': {
        const { startDate, endDate, storeId } = args
        const targetStores = resolveTargetStores(storeId)

        const { data: transactions, error: txErr } = await supabase
          .from('transactions')
          .select('total_price, discount, transaction_time, category_id, store_id')
          .in('store_id', targetStores)
          .gte('transaction_time', `${startDate}T00:00:00`)
          .lte('transaction_time', `${endDate}T23:59:59.999Z`)
          .order('transaction_time', { ascending: true })

        if (txErr) throw txErr

        const { data: categories } = await supabase
          .from('product_category')
          .select('id, category')
          .in('store_id', targetStores)

        const categoryMap = new Map((categories || []).map((c) => [c.id, c.category]))

        // Group by day
        const dailyTotals: Record<string, { date: string; sales: number; count: number; discounts: number }> = {}
        const categoryTotals: Record<string, number> = {}

        for (const tx of transactions || []) {
          const day = tx.transaction_time.split('T')[0]
          if (!dailyTotals[day]) {
            dailyTotals[day] = { date: day, sales: 0, count: 0, discounts: 0 }
          }
          dailyTotals[day].sales += Number(tx.total_price) || 0
          dailyTotals[day].discounts += Number(tx.discount) || 0
          dailyTotals[day].count += 1

          const catName = (tx.category_id && categoryMap.get(tx.category_id)) || 'General / Uncategorized'
          categoryTotals[catName] = (categoryTotals[catName] || 0) + (Number(tx.total_price) || 0)
        }

        return {
          dailyTrends: Object.values(dailyTotals),
          categoryBreakdown: Object.entries(categoryTotals)
            .map(([category, revenue]) => ({ category, revenue }))
            .sort((a, b) => b.revenue - a.revenue),
        }
      }

      case 'get_top_and_worst_sellers': {
        const { storeId, startDate, endDate, limit = 10 } = args
        const targetStores = resolveTargetStores(storeId)

        let query = supabase
          .from('transactions')
          .select('item_name, sku, total_price, quantity, store_id, transaction_time')
          .in('store_id', targetStores)

        if (startDate) query = query.gte('transaction_time', `${startDate}T00:00:00`)
        if (endDate) query = query.lte('transaction_time', `${endDate}T23:59:59.999Z`)

        const { data: transactions, error: txErr } = await query
        if (txErr) throw txErr

        // Aggregate by item name
        const itemAgg: Record<string, { itemName: string; sku: string | null; quantitySold: number; totalRevenue: number }> = {}

        for (const tx of transactions || []) {
          const name = (tx.item_name || 'Unknown Item').trim()
          if (!itemAgg[name]) {
            itemAgg[name] = { itemName: name, sku: tx.sku || null, quantitySold: 0, totalRevenue: 0 }
          }
          itemAgg[name].quantitySold += Number(tx.quantity) || 1
          itemAgg[name].totalRevenue += Number(tx.total_price) || 0
        }

        const itemsSortedByRevenue = Object.values(itemAgg).sort((a, b) => b.totalRevenue - a.totalRevenue)
        const topSellers = itemsSortedByRevenue.slice(0, limit)
        const lowVolumeSellers = [...itemsSortedByRevenue].reverse().slice(0, limit)

        // Find dead stock (items in catalog with 0 sales)
        const { data: catalogItems } = await supabase
          .from('items')
          .select('id, item_name, sku, sales_price, unit_cost, low_stock_threshold')
          .in('store_id', targetStores)

        const soldItemNames = new Set(Object.keys(itemAgg).map((n) => n.toLowerCase()))
        const deadStock = (catalogItems || [])
          .filter((item) => !soldItemNames.has(item.item_name.toLowerCase()))
          .slice(0, limit)
          .map((item) => ({
            itemName: item.item_name,
            sku: item.sku,
            price: item.sales_price,
            unitCost: item.unit_cost,
          }))

        return {
          topSellers,
          lowVolumeSellers,
          deadStockItemsWithZeroSales: deadStock,
        }
      }

      case 'get_transactions_data': {
        const { storeId, startDate, endDate, search, minAmount, limit = 20 } = args
        const targetStores = resolveTargetStores(storeId)

        let query = supabase
          .from('transactions')
          .select(`
            id,
            sku,
            item_name,
            sales_price,
            total_price,
            discount,
            quantity,
            invoice_no,
            transaction_time,
            cashier,
            store_id,
            stores(store_name),
            users(first_name, last_name, role)
          `)
          .in('store_id', targetStores)
          .order('transaction_time', { ascending: false })
          .limit(Math.min(limit, 50))

        if (startDate) query = query.gte('transaction_time', `${startDate}T00:00:00`)
        if (endDate) query = query.lte('transaction_time', `${endDate}T23:59:59.999Z`)
        if (minAmount) query = query.gte('total_price', minAmount)
        if (search) query = query.or(`item_name.ilike.%${search}%,invoice_no.ilike.%${search}%`)

        const { data, error } = await query
        if (error) throw error

        return {
          count: data?.length || 0,
          transactions: (data || []).map((t: any) => ({
            id: t.id,
            invoiceNo: t.invoice_no,
            itemName: t.item_name,
            salesPrice: t.sales_price,
            totalPrice: t.total_price,
            discount: t.discount,
            quantity: t.quantity,
            store: t.stores?.store_name || t.store_id,
            cashier: t.users ? `${t.users.first_name || ''} ${t.users.last_name || ''}`.trim() : 'Unknown',
            time: t.transaction_time,
          })),
        }
      }

      case 'detect_anomalies': {
        const { storeId, startDate, endDate } = args
        const targetStores = resolveTargetStores(storeId)

        // Default to last 30 days if not supplied
        const now = new Date()
        const end = endDate || now.toISOString().split('T')[0]
        const defaultStart = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0]
        const start = startDate || defaultStart

        // 1. Fetch transactions in range
        const { data: transactions, error: txErr } = await supabase
          .from('transactions')
          .select(`
            id,
            sku,
            item_name,
            sales_price,
            total_price,
            discount,
            quantity,
            invoice_no,
            transaction_time,
            cashier,
            store_id,
            stores(store_name),
            users(first_name, last_name)
          `)
          .in('store_id', targetStores)
          .gte('transaction_time', `${start}T00:00:00`)
          .lte('transaction_time', `${end}T23:59:59.999Z`)
          .order('transaction_time', { ascending: false })

        if (txErr) throw txErr

        // 2. Fetch expenses in range
        const { data: expenses, error: expErr } = await supabase
          .from('expenses')
          .select(`
            id,
            amount,
            receipt_no,
            notes,
            cashout_type,
            transaction_date,
            store_id,
            stores(store_name)
          `)
          .in('store_id', targetStores)
          .gte('transaction_date', start)
          .lte('transaction_date', end)

        if (expErr) throw expErr

        const anomalies: Array<{
          type: string
          severity: 'CRITICAL' | 'WARNING' | 'INFO'
          description: string
          details: Record<string, any>
          recommendedAction: string
        }> = []

        // Anomaly Check 1: Excessive discounts (>25% or > 300 PHP)
        for (const tx of transactions || []) {
          const discount = Number(tx.discount) || 0
          const total = Number(tx.total_price) || 0
          const fullPrice = total + discount
          const discountPercent = fullPrice > 0 ? (discount / fullPrice) * 100 : 0

          if (discountPercent >= 25 || discount >= 500) {
            anomalies.push({
              type: 'HIGH_DISCOUNT',
              severity: discountPercent > 50 || discount > 1000 ? 'CRITICAL' : 'WARNING',
              description: `Abnormally high discount of ₱${discount.toFixed(2)} (${discountPercent.toFixed(1)}%) applied to "${tx.item_name}"`,
              details: {
                invoiceNo: tx.invoice_no,
                itemName: tx.item_name,
                fullPrice,
                finalPrice: total,
                discountGiven: discount,
                store: (tx as any).stores?.store_name,
                cashier: (tx as any).users ? `${(tx as any).users.first_name || ''} ${(tx as any).users.last_name || ''}`.trim() : 'Unknown',
                time: tx.transaction_time,
              },
              recommendedAction: 'Verify cashier authorization and check if a manager override code was properly documented.',
            })
          }
        }

        // Anomaly Check 2: Off-Hours Transactions (11 PM - 5 AM)
        for (const tx of transactions || []) {
          const date = new Date(tx.transaction_time)
          const hour = date.getHours()
          if (hour >= 23 || hour <= 4) {
            anomalies.push({
              type: 'OFF_HOURS_ACTIVITY',
              severity: 'WARNING',
              description: `Transaction occurred during unusual operating hours (${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
              details: {
                invoiceNo: tx.invoice_no,
                amount: tx.total_price,
                store: (tx as any).stores?.store_name,
                time: tx.transaction_time,
              },
              recommendedAction: 'Verify whether the store was legitimately open for extended operations or night maintenance.',
            })
          }
        }

        // Anomaly Check 3: Large Undocumented Expenses
        for (const exp of expenses || []) {
          const amount = Number(exp.amount) || 0
          const hasReceipt = !!(exp.receipt_no && exp.receipt_no.trim().length > 0)
          const hasNotes = !!(exp.notes && exp.notes.trim().length > 0)

          if (amount >= 5000 && (!hasReceipt || !hasNotes)) {
            anomalies.push({
              type: 'UNDOCUMENTED_EXPENSE',
              severity: amount >= 15000 ? 'CRITICAL' : 'WARNING',
              description: `Large cashout of ₱${amount.toLocaleString()} missing ${!hasReceipt ? 'receipt number' : ''} ${!hasNotes ? 'and explanation notes' : ''}`,
              details: {
                expenseId: exp.id,
                amount,
                type: exp.cashout_type,
                date: exp.transaction_date,
                store: (exp as any).stores?.store_name,
                receiptNo: exp.receipt_no || 'None',
                notes: exp.notes || 'None',
              },
              recommendedAction: 'Request supporting receipts and documentation from the staff member who logged the cashout.',
            })
          }
        }

        // Anomaly Check 4: Rapid Duplicate Transactions
        const sortedTx = [...(transactions || [])].sort((a, b) => new Date(a.transaction_time).getTime() - new Date(b.transaction_time).getTime())
        for (let i = 0; i < sortedTx.length - 1; i++) {
          const curr = sortedTx[i]
          const next = sortedTx[i + 1]
          if (
            curr.cashier === next.cashier &&
            curr.item_name === next.item_name &&
            curr.total_price === next.total_price &&
            curr.store_id === next.store_id
          ) {
            const timeDiffSec = (new Date(next.transaction_time).getTime() - new Date(curr.transaction_time).getTime()) / 1000
            if (timeDiffSec > 0 && timeDiffSec <= 60) {
              anomalies.push({
                type: 'POSSIBLE_DUPLICATE_CHARGE',
                severity: 'INFO',
                description: `Identical transaction for "${curr.item_name}" (₱${curr.total_price}) processed ${Math.round(timeDiffSec)} seconds apart`,
                details: {
                  firstInvoice: curr.invoice_no,
                  secondInvoice: next.invoice_no,
                  amount: curr.total_price,
                  store: (curr as any).stores?.store_name,
                  timeDiffSeconds: Math.round(timeDiffSec),
                },
                recommendedAction: 'Check if this was a customer buying multiple items in separate bills or an accidental double scan.',
              })
            }
          }
        }

        return {
          scanPeriod: { startDate: start, endDate: end },
          totalTransactionsScanned: (transactions || []).length,
          totalExpensesScanned: (expenses || []).length,
          anomaliesFoundCount: anomalies.length,
          criticalCount: anomalies.filter((a) => a.severity === 'CRITICAL').length,
          warningCount: anomalies.filter((a) => a.severity === 'WARNING').length,
          infoCount: anomalies.filter((a) => a.severity === 'INFO').length,
          anomalies: anomalies.slice(0, 25),
        }
      }

      case 'get_inventory_status': {
        const { storeId, filter = 'all', limit = 30 } = args
        const targetStores = resolveTargetStores(storeId)

        const { data: items, error } = await supabase
          .from('items')
          .select(`
            id,
            item_name,
            sku,
            sales_price,
            unit_cost,
            low_stock_threshold,
            store_id,
            stores(store_name)
          `)
          .in('store_id', targetStores)
          .limit(limit)

        if (error) throw error

        const itemIds = (items || []).map((i) => i.id)
        const { data: flows } = await supabase
          .from('stock_flow')
          .select('item_id, flow, quantity')
          .in('item_id', itemIds)

        const itemStockMap: Record<string, number> = {}
        for (const f of flows || []) {
          const qty = Number(f.quantity) || 0
          if (f.flow === 'in') {
            itemStockMap[f.item_id] = (itemStockMap[f.item_id] || 0) + qty
          } else if (f.flow === 'out') {
            itemStockMap[f.item_id] = (itemStockMap[f.item_id] || 0) - qty
          }
        }

        const itemsWithStock = (items || []).map((item) => {
          const estimatedStock = itemStockMap[item.id] !== undefined ? itemStockMap[item.id] : 10
          const threshold = item.low_stock_threshold || 5
          let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock'
          if (estimatedStock <= 0) status = 'out_of_stock'
          else if (estimatedStock <= threshold) status = 'low_stock'

          return {
            id: item.id,
            itemName: item.item_name,
            sku: item.sku,
            price: item.sales_price,
            unitCost: item.unit_cost,
            estimatedStock,
            threshold,
            status,
            store: (item as any).stores?.store_name,
          }
        })

        const filtered = itemsWithStock.filter((i) => {
          if (filter === 'low_stock') return i.status === 'low_stock'
          if (filter === 'out_of_stock') return i.status === 'out_of_stock'
          return true
        })

        return {
          totalItems: filtered.length,
          items: filtered,
        }
      }

      case 'get_expenses_breakdown': {
        const { startDate, endDate, storeId } = args
        const targetStores = resolveTargetStores(storeId)

        const { data: expenses, error } = await supabase
          .from('expenses')
          .select(`
            id,
            amount,
            receipt_no,
            notes,
            cashout_type,
            source,
            transaction_date,
            store_id,
            classification:classification_id(name),
            category:category_id(category),
            remittance:remittance_category_id(name)
          `)
          .in('store_id', targetStores)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('transaction_date', { ascending: false })

        if (error) throw error

        const breakdownByType: Record<string, { total: number; count: number; subcategories: Record<string, number> }> = {
          COGS: { total: 0, count: 0, subcategories: {} },
          OPEX: { total: 0, count: 0, subcategories: {} },
          REMITTANCE: { total: 0, count: 0, subcategories: {} },
        }

        for (const exp of expenses || []) {
          const type = exp.cashout_type || 'OPEX'
          const amount = Number(exp.amount) || 0
          if (!breakdownByType[type]) {
            breakdownByType[type] = { total: 0, count: 0, subcategories: {} }
          }
          breakdownByType[type].total += amount
          breakdownByType[type].count += 1

          const sub = (exp.classification as any)?.name || (exp.category as any)?.category || (exp.remittance as any)?.name || 'General'
          breakdownByType[type].subcategories[sub] = (breakdownByType[type].subcategories[sub] || 0) + amount
        }

        return {
          period: { startDate, endDate },
          summary: breakdownByType,
          recentExpenses: (expenses || []).slice(0, 15).map((e: any) => ({
            id: e.id,
            type: e.cashout_type,
            amount: e.amount,
            date: e.transaction_date,
            receiptNo: e.receipt_no,
            notes: e.notes,
            category: e.classification?.name || e.category?.category || e.remittance?.name || 'General',
          })),
        }
      }

      case 'get_staff_performance': {
        const { storeId, startDate, endDate } = args
        const targetStores = resolveTargetStores(storeId)

        let query = supabase
          .from('transactions')
          .select(`
            total_price,
            discount,
            cashier,
            store_id,
            users(first_name, last_name, email, role)
          `)
          .in('store_id', targetStores)

        if (startDate) query = query.gte('transaction_time', `${startDate}T00:00:00`)
        if (endDate) query = query.lte('transaction_time', `${endDate}T23:59:59.999Z`)

        const { data: transactions, error } = await query
        if (error) throw error

        const cashierStats: Record<string, { name: string; email: string | null; role: string; totalSales: number; transactionCount: number; totalDiscounts: number }> = {}

        for (const tx of transactions || []) {
          const cashierId = tx.cashier || 'unknown'
          const u = (tx as any).users
          const name = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Unknown Cashier'

          if (!cashierStats[cashierId]) {
            cashierStats[cashierId] = {
              name: name || 'Cashier',
              email: u?.email || null,
              role: u?.role || 'staff',
              totalSales: 0,
              transactionCount: 0,
              totalDiscounts: 0,
            }
          }
          cashierStats[cashierId].totalSales += Number(tx.total_price) || 0
          cashierStats[cashierId].totalDiscounts += Number(tx.discount) || 0
          cashierStats[cashierId].transactionCount += 1
        }

        const performanceList = Object.values(cashierStats).map((c) => ({
          ...c,
          averageTicketSize: c.transactionCount > 0 ? Number((c.totalSales / c.transactionCount).toFixed(2)) : 0,
        }))

        return {
          cashiersAudited: performanceList.length,
          performance: performanceList.sort((a, b) => b.totalSales - a.totalSales),
        }
      }

      case 'get_customer_insights': {
        const { storeId, limit = 15 } = args
        const targetStores = resolveTargetStores(storeId)

        const { data: customers, error } = await supabase
          .from('customers')
          .select(`
            id,
            full_name,
            phone_number,
            email,
            total_spent,
            visit_count,
            last_visit_at,
            remarks,
            store_id,
            stores(store_name)
          `)
          .in('store_id', targetStores)
          .order('total_spent', { ascending: false })
          .limit(limit)

        if (error) throw error

        return {
          totalCustomersRetrieved: customers?.length || 0,
          topCustomers: (customers || []).map((c: any) => ({
            id: c.id,
            name: c.full_name,
            phone: c.phone_number,
            email: c.email,
            totalSpent: c.total_spent,
            visits: c.visit_count,
            lastVisit: c.last_visit_at,
            store: c.stores?.store_name,
          })),
        }
      }

      default:
        return { error: `Tool ${toolName} is not supported.` }
    }
  } catch (err: any) {
    console.error(`[executeJunfueTool] Error running ${toolName}:`, err)
    return { error: err.message || 'Internal database query failure.' }
  }
}
