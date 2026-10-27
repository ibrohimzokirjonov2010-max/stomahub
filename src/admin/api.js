import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { monthBounds } from './format'
import { shotRpc } from './shotFixtures'

function iso(d) {
  return new Date(d).toISOString()
}

async function rpc(name, args = {}) {
  if (typeof window !== 'undefined' && window.__ADMIN_SHOT__) {
    const fix = shotRpc(name, args)
    if (fix != null) return fix
  }
  if (!supabase) throw new Error('Supabase sozlanmagan')
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw error
  return data
}

export async function fetchDashboard(from, to) {
  return rpc('admin_dashboard', { p_from: iso(from), p_to: iso(to) })
}
export async function fetchSellerApplication(id) {
  return rpc('admin_seller_application', { p_id: id })
}
export async function reviewSeller(id, action, reason = '') {
  return rpc('admin_review_seller', { p_id: id, p_action: action, p_reason: reason })
}
export async function adminQueue() {
  return rpc('admin_review_queue')
}
export async function adminReview(id, approve, reason = '') {
  return rpc('admin_review_product', { p_id: id, p_approve: approve, p_reason: reason })
}

export const listUsers = (a) => rpc('admin_users_list', { p_tab: a.tab || 'all', p_q: a.q || '', p_page: a.page || 1, p_page_size: a.pageSize || 10 })
export const userDetail = (id) => rpc('admin_user_detail', { p_id: id })
export const userBlock = (id, block, reason = '') => rpc('admin_user_block', { p_id: id, p_block: block, p_reason: reason })

export const listSellers = (a) => rpc('admin_sellers_list', { p_tab: a.tab || 'all', p_q: a.q || '', p_page: a.page || 1, p_page_size: a.pageSize || 10 })

export const listOrganizers = (a) => rpc('admin_organizers_list', { p_tab: a.tab || 'all', p_q: a.q || '', p_page: a.page || 1, p_page_size: a.pageSize || 10 })
export const organizerDetail = (id) => rpc('admin_organizer_detail', { p_id: id })
export const reviewOrganizer = (id, action, reason = '') => rpc('admin_review_organizer', { p_id: id, p_action: action, p_reason: reason })

export const listCampaigns = (a) => rpc('admin_campaigns_list', { p_tab: a.tab || 'all', p_q: a.q || '', p_page: a.page || 1, p_page_size: a.pageSize || 10 })
export const campaignDetail = (id) => rpc('admin_campaign_detail', { p_id: id })
export const reviewCampaign = (id, action, reason = '') => rpc('admin_review_campaign', { p_id: id, p_action: action, p_reason: reason })

export const listOrders = (a) => rpc('admin_orders_list', { p_tab: a.tab || 'all', p_q: a.q || '', p_page: a.page || 1, p_page_size: a.pageSize || 10 })
export const orderDetail = (id) => rpc('admin_order_detail', { p_id: id })

export const fetchEscrow = (a) => rpc('admin_escrow', { p_page: a.page || 1, p_page_size: a.pageSize || 10, p_q: a.q || '' })

export const listApprovals = (a) => rpc('admin_approvals_list', { p_type: a.type || 'all', p_q: a.q || '', p_page: a.page || 1, p_page_size: a.pageSize || 10 })

export const fetchFinance = (from, to) => rpc('admin_finance', { p_from: iso(from), p_to: iso(to) })
export const listPayouts = (a) => rpc('admin_payouts_list', { p_tab: a.tab || 'all', p_q: a.q || '', p_page: a.page || 1, p_page_size: a.pageSize || 10 })
export const reviewPayout = (id, action, reason = '') => rpc('admin_review_payout', { p_id: id, p_action: action, p_reason: reason })

export const listComplaints = (a) => rpc('admin_complaints_list', { p_tab: a.tab || 'all', p_q: a.q || '', p_page: a.page || 1, p_page_size: a.pageSize || 10 })
export const updateComplaint = (id, status, resolution = '') => rpc('admin_complaint_update', { p_id: id, p_status: status, p_resolution: resolution })

export const fetchReports = (from, to) => rpc('admin_reports', { p_from: iso(from), p_to: iso(to) })

export const getSettings = () => rpc('admin_settings_get')
export const setSettings = (p) => rpc('admin_settings_set', { p })

const EMPTY = {
  turnover: 0, escrow: 0, commission: 0, net: 0, orders_count: 0, orders_prev: 0,
  products_count: 0, users_count: 0, active_users: 0, seminars_count: 0,
  new_users: { total: 0, customers: 0, sellers: 0, organizers: 0 },
  daily: [], categories: [], recent_orders: [],
  pending: { sellers: 0, organizers: 0, ads: 0, products: 0, users: 0 },
  complaints: [], activity: [], pending_sellers: [],
}

export function useAdminDashboard(month) {
  const [state, setState] = useState({ loading: true, error: '', data: EMPTY, needsMigration: false })
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    const { from, to } = monthBounds(month)
    try {
      const raw = await fetchDashboard(from, to)
      setState({ loading: false, error: '', data: normalizeDashboard(raw), needsMigration: false })
    } catch (e) {
      const msg = e?.message || String(e)
      const needsMigration = /admin_dashboard|Could not find the function|schema cache|404|PGRST/i.test(msg)
      setState({
        loading: false,
        error: needsMigration
          ? 'admin_dashboard RPC topilmadi. supabase/migrations/0011_admin_dashboard.sql ni Supabase’da qo‘llang.'
          : msg,
        data: EMPTY,
        needsMigration,
      })
    }
  }, [month])
  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}

function normalizeDashboard(raw) {
  const d = raw && typeof raw === 'object' ? raw : {}
  return {
    turnover: Number(d.turnover) || 0,
    escrow: Number(d.escrow) || 0,
    commission: Number(d.commission) || 0,
    net: Number(d.net) || Math.max(0, (Number(d.turnover) || 0) - (Number(d.commission) || 0)),
    orders_count: Number(d.orders_count) || 0,
    orders_prev: Number(d.orders_prev) || 0,
    products_count: Number(d.products_count) || 0,
    users_count: Number(d.users_count) || 0,
    active_users: Number(d.active_users) || 0,
    seminars_count: Number(d.seminars_count) || 0,
    new_users: {
      total: Number(d.new_users?.total) || 0,
      customers: Number(d.new_users?.customers) || 0,
      sellers: Number(d.new_users?.sellers) || 0,
      organizers: Number(d.new_users?.organizers) || 0,
    },
    daily: Array.isArray(d.daily) ? d.daily.map((x) => ({ day: Number(x.day) || 0, sum: Number(x.sum) || 0 })) : [],
    categories: Array.isArray(d.categories) ? d.categories.map((x) => ({
      name: x.name || 'Boshqa', orders: Number(x.orders) || 0, sum: Number(x.sum) || 0,
    })) : [],
    recent_orders: Array.isArray(d.recent_orders) ? d.recent_orders : [],
    pending: {
      sellers: Number(d.pending?.sellers) || 0,
      organizers: Number(d.pending?.organizers) || 0,
      ads: Number(d.pending?.ads) || 0,
      products: Number(d.pending?.products) || 0,
      users: Number(d.pending?.users) || 0,
    },
    complaints: Array.isArray(d.complaints) ? d.complaints : [],
    activity: Array.isArray(d.activity) ? d.activity : [],
    pending_sellers: Array.isArray(d.pending_sellers) ? d.pending_sellers : [],
  }
}

/** Generic list loader for admin pages. */
export function useAdminList(fetcher, deps) {
  const [state, setState] = useState({
    loading: true, error: '', needsMigration: false,
    rows: [], total: 0, counts: {}, extra: {},
  })
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    try {
      const raw = await fetcher()
      setState({
        loading: false, error: '', needsMigration: false,
        rows: raw?.rows || [],
        total: Number(raw?.total) || 0,
        counts: raw?.counts || {},
        extra: raw || {},
      })
    } catch (e) {
      const msg = e?.message || String(e)
      const needsMigration = /Could not find the function|schema cache|404|PGRST|admin_/i.test(msg)
      setState({
        loading: false,
        error: needsMigration
          ? 'Kerakli RPC topilmadi. supabase/migrations/0012_admin_sections.sql ni Supabase’da qo‘llang.'
          : msg,
        needsMigration: true,
        rows: [], total: 0, counts: {}, extra: {},
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}
