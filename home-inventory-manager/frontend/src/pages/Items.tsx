import { useState, useEffect, useCallback } from 'react'
import {
  Card, Tag, Button, Space, Input, Select, Modal, Form,
  InputNumber, DatePicker, App, Tooltip, Typography, Empty, Segmented,
} from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, SmileOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import api from '../api'
import { useAppContext } from '../contexts/AppContext'

const { Title, Text, Paragraph } = Typography

const cardVariant = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' as const },
  }),
}

export default function Items() {
  const { categories, refresh: refreshCtx } = useAppContext()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [sortBy, setSortBy] = useState('created_at')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [editModal, setEditModal] = useState<any>(null)
  const [form] = Form.useForm()
  const { message, modal } = App.useApp()

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { sort_by: sortBy }
      if (search) params.search = search
      if (categoryFilter) params.category_id = categoryFilter
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/items', { params })
      if (res.data.success) setItems(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, statusFilter, sortBy])

  useEffect(() => { loadItems() }, [loadItems])

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '确认删除', content: '删除后不可恢复，确认删除该物品？',
      okButtonProps: { danger: true },
      onOk: async () => { await api.delete(`/items/${id}`); message.success('已删除'); loadItems(); refreshCtx() },
    })
  }

  const handleChangeStatus = (id: number, name: string, status: string) => {
    const labels: any = { missing: '标记为缺少', in_stock: '恢复为在库', out_of_stock: '标记为已用完' }
    modal.confirm({
      title: '修改状态', content: `确认将「${name}」${labels[status]}？`,
      onOk: async () => {
        await api.patch(`/items/${id}/status`, { status })
        message.success('状态已更新'); loadItems(); refreshCtx()
      },
    })
  }

  const openEdit = (item: any) => {
    setEditModal(item)
    form.setFieldsValue({ ...item, expiry_date: item.expiry_date ? dayjs(item.expiry_date) : null })
  }

  const handleEdit = async () => {
    const values = await form.validateFields()
    await api.put(`/items/${editModal.id}`, { ...values, expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : null })
    message.success('已更新'); setEditModal(null); loadItems()
  }

  const statusConfig: any = {
    in_stock: { color: '#A8D8B9', bg: '#F0FFF4', text: '在库' },
    out_of_stock: { color: '#FAD02C', bg: '#FFFDE6', text: '已用完' },
    missing: { color: '#FF7675', bg: '#FFF0F0', text: '缺少' },
  }

  const renderCard = (item: any, i: number) => {
    const st = statusConfig[item.status] || statusConfig.in_stock
    const isExpired = item.expiry_date && dayjs(item.expiry_date).diff(dayjs(), 'day') <= 3

    return (
      <motion.div key={item.id} custom={i} variants={cardVariant} initial="hidden" animate="visible">
        <Card
          className="warm-card"
          hoverable
          style={{
            borderLeft: `4px solid ${st.color}`,
            background: isExpired ? '#FFF5F5' : '#fff',
          }}
          bodyStyle={{ padding: '16px 20px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text strong style={{ fontSize: 16, color: '#5C4033' }}>{item.name}</Text>
                <Tag color={st.color} style={{ borderRadius: 10 }}>{st.text}</Tag>
                {isExpired && <Tag color="red" style={{ borderRadius: 10, animation: 'pulse 2s infinite' }}>即将过期</Tag>}
              </div>
              <Space size={[12, 4]} wrap>
                <Text type="secondary">分类：{item.category_name || '-'}</Text>
                <Text type="secondary">数量：{item.quantity}</Text>
                <Text type="secondary">过期：{item.expiry_date || '-'}</Text>
                {item.notes && (
                  <Tooltip title={item.notes}>
                    <Text type="secondary" style={{ maxWidth: 120 }} ellipsis>备注：{item.notes}</Text>
                  </Tooltip>
                )}
              </Space>
            </div>
            <Space>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(item)}
                style={{ borderRadius: 12 }}>编辑</Button>
              {item.status === 'in_stock' ? (
                <Button size="small" onClick={() => handleChangeStatus(item.id, item.name, 'missing')}
                  style={{ borderRadius: 12, color: '#FF7675', borderColor: '#FF7675' }}>缺货</Button>
              ) : (
                <Button size="small" onClick={() => handleChangeStatus(item.id, item.name, 'in_stock')}
                  style={{ borderRadius: 12, color: '#A8D8B9', borderColor: '#A8D8B9' }}>恢复</Button>
              )}
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)}
                style={{ borderRadius: 12 }} />
            </Space>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Title level={3} style={{ color: '#5C4033' }}>全部库存</Title>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <Space wrap style={{ marginBottom: 20 }}>
          <Input prefix={<SearchOutlined />} placeholder="搜索物品名称" allowClear
            value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200, borderRadius: 12 }} />
          <Select placeholder="按分类筛选" allowClear style={{ width: 130, borderRadius: 12 }}
            value={categoryFilter} onChange={setCategoryFilter}
            options={categories.map(c => ({ label: c.name, value: c.id }))} />
          <Select placeholder="按状态筛选" allowClear style={{ width: 120, borderRadius: 12 }}
            value={statusFilter} onChange={setStatusFilter}
            options={[{ label: '在库', value: 'in_stock' }, { label: '已用完', value: 'out_of_stock' }, { label: '缺少', value: 'missing' }]} />
          <Select style={{ width: 140, borderRadius: 12 }} value={sortBy} onChange={setSortBy}
            options={[{ label: '按添加时间', value: 'created_at' }, { label: '按过期日期', value: 'expiry_date' }, { label: '按名称', value: 'name' }]} />
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as 'card' | 'table')}
            options={[
              { value: 'card', icon: <AppstoreOutlined /> },
              { value: 'table', icon: <UnorderedListOutlined /> },
            ]}
          />
        </Space>
      </motion.div>

      {items.length === 0 && !loading ? (
        <div className="empty-illustration" style={{ padding: 80 }}>
          <SmileOutlined style={{ fontSize: 56, color: '#FFD8C0', marginBottom: 16 }} />
          <Text type="secondary" style={{ fontSize: 16 }}>等待第一个小伙伴的加入~</Text>
        </div>
      ) : (
        <AnimatePresence>
          {viewMode === 'card' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item, i) => renderCard(item, i))}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, i) => renderCard(item, i))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <Modal title="编辑物品" open={!!editModal} onOk={handleEdit} onCancel={() => setEditModal(null)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="物品名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category_id" label="分类" rules={[{ required: true }]}>
            <Select options={categories.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="quantity" label="数量"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="expiry_date" label="过期日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
