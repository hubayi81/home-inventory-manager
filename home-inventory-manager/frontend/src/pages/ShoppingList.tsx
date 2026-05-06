import { useState, useEffect, useCallback } from 'react'
import {
  Button, Space, Input, Modal, App, Typography, List, Tag, InputNumber, Checkbox, Badge,
} from 'antd'
import { PlusOutlined, DeleteOutlined, ShoppingCartOutlined, SmileOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import { useAppContext } from '../contexts/AppContext'

const { Title, Text } = Typography

const itemVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const },
  }),
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
}

export default function ShoppingList() {
  const { refresh: refreshCtx } = useAppContext()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [addName, setAddName] = useState('')
  const [addQty, setAddQty] = useState(1)
  const { message, modal } = App.useApp()

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/shopping-list')
      if (res.data.success) setItems(res.data.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const handleAdd = async () => {
    if (!addName.trim()) return
    try {
      await api.post('/shopping-list', { item_name: addName.trim(), quantity: addQty })
      message.success('已添加到购物清单~')
      setAddModal(false); setAddName(''); setAddQty(1); loadItems(); refreshCtx()
    } catch (e) { console.error(e) }
  }

  const handlePurchase = async (item: any) => {
    modal.confirm({
      title: '标记已采购', content: `确认已购买「${item.item_name}」？`,
      onOk: async () => {
        await api.put(`/shopping-list/${item.id}`, { purchased: true })
        message.success('已标记采购~'); loadItems(); refreshCtx()
      },
    })
  }

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '确认删除', content: '删除该购物清单项？', okButtonProps: { danger: true },
      onOk: async () => { await api.delete(`/shopping-list/${id}`); message.success('已删除'); loadItems(); refreshCtx() },
    })
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingCartOutlined style={{ fontSize: 26, color: '#FF9A76' }} />
            <div>
              <Title level={3} style={{ margin: 0, color: '#5C4033' }}>购物清单</Title>
              <Text type="secondary">需要采购的物品都在这里~</Text>
            </div>
          </div>
          <Badge count={items.length} style={{ backgroundColor: '#FF9A76' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}
              className="warm-btn-primary">添加缺少物品</Button>
          </Badge>
        </div>
      </motion.div>

      {items.length === 0 ? (
        <div className="empty-illustration" style={{ padding: 80 }}>
          <ShoppingCartOutlined style={{ fontSize: 56, color: '#FFD8C0', marginBottom: 16 }} />
          <Text type="secondary" style={{ fontSize: 16 }}>不用买也挺好的，轻松一天~</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>当有物品缺少时，会自动添加到这里</Text>
        </div>
      ) : (
        <AnimatePresence>
          <List
            loading={loading}
            dataSource={items}
            renderItem={(item: any, i: number) => (
              <motion.div key={item.id} custom={i} variants={itemVariant} initial="hidden" animate="visible" exit="exit">
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', marginBottom: 8,
                  background: '#fff', borderRadius: 16,
                  boxShadow: '0 2px 12px rgba(255, 154, 118, 0.06)',
                  border: '1px solid #FFF0E6',
                  transition: 'all 0.3s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <Checkbox
                      style={{ transform: 'scale(1.2)' }}
                      onChange={() => handlePurchase(item)}
                    />
                    <div>
                      <Text strong style={{ fontSize: 16, color: '#5C4033' }}>{item.item_name}</Text>
                      <div style={{ marginTop: 2 }}>
                        <Space size={8}>
                          <Text type="secondary">x{item.quantity}</Text>
                          {item.item_id ? <Tag color="#A8D8B9" style={{ borderRadius: 10 }}>库存关联</Tag>
                            : <Tag color="#FFD8C0" style={{ borderRadius: 10 }}>手动添加</Tag>}
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.created_at?.slice(0, 10)}
                          </Text>
                        </Space>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="small" danger icon={<DeleteOutlined />}
                    onClick={() => handleDelete(item.id)}
                    style={{ borderRadius: 12 }}
                  />
                </div>
              </motion.div>
            )}
          />
        </AnimatePresence>
      )}

      <Modal title="添加缺少物品" open={addModal} onOk={handleAdd} onCancel={() => setAddModal(false)}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>物品名称：</Text>
            <Input value={addName} onChange={e => setAddName(e.target.value)}
              placeholder="请输入物品名称" style={{ marginTop: 4, borderRadius: 12 }} />
          </div>
          <div>
            <Text>数量：</Text>
            <InputNumber min={1} value={addQty} onChange={v => setAddQty(v || 1)} style={{ marginTop: 4, width: '100%', borderRadius: 12 }} />
          </div>
        </Space>
      </Modal>
    </div>
  )
}
