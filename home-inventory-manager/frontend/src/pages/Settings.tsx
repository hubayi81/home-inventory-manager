import { useState, useEffect } from 'react'
import {
  Card, Form, InputNumber, Button, List, Input, App, Space, Typography, Popconfirm, Divider, Empty, Segmented,
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, SettingOutlined, SmileOutlined, FontSizeOutlined, BellOutlined } from '@ant-design/icons'
import { subscribeToPush, unsubscribeFromPush, requestNotificationPermission, isPushSubscribed } from '../services/sw'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import api from '../api'
import { useAppContext } from '../contexts/AppContext'

const { Title, Text } = Typography

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' as const },
  }),
}

const fontOptions = [
  { label: '标准', value: 'normal' },
  { label: '大', value: 'large' },
  { label: '超大', value: 'xlarge' },
]

export default function Settings() {
  const { categories, reminderDays: ctxDays, fontSize: ctxFontSize, refresh } = useAppContext()
  const { message } = App.useApp()

  const [reminderDays, setReminderDays] = useState(ctxDays)
  const [savingDays, setSavingDays] = useState(false)
  const [fontSize, setFontSize] = useState(ctxFontSize)
  const [savingFont, setSavingFont] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingCat, setEditingCat] = useState<{ id: number; name: string } | null>(null)
  const [editCatName, setEditCatName] = useState('')

  // 推送通知
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const { user } = useAuth()

  // 上传图片统计
  const [imageCount, setImageCount] = useState(0)

  useEffect(() => {
    setReminderDays(ctxDays)
    setFontSize(ctxFontSize)
    loadImageCount()
    checkPushStatus()
  }, [ctxDays, ctxFontSize])

  const checkPushStatus = async () => {
    const subbed = await isPushSubscribed()
    setPushEnabled(subbed)
  }

  const handleTogglePush = async (enable: boolean) => {
    setPushLoading(true)
    try {
      if (enable) {
        const permitted = await requestNotificationPermission()
        if (!permitted) {
          message.warning('请在浏览器设置中允许通知权限')
          setPushLoading(false)
          return
        }
        const ok = await subscribeToPush(user?.user_id || 0)
        if (ok) {
          setPushEnabled(true)
          message.success('已开启过期提醒~')
        } else {
          message.error('开启失败，请检查浏览器是否支持通知')
        }
      } else {
        await unsubscribeFromPush(user?.user_id || 0)
        setPushEnabled(false)
        message.success('已关闭过期提醒')
      }
    } catch (e) {
      message.error('操作失败')
    }
    setPushLoading(false)
  }

  const handleSaveFont = async (fs: string) => {
    setSavingFont(true)
    setFontSize(fs)
    document.documentElement.setAttribute('data-font-size', fs)
    try {
      await api.put('/settings', { font_size: fs })
      message.success('字体大小已更新~')
      refresh()
    } catch (e) { message.error('保存失败') }
    setSavingFont(false)
  }

  const loadImageCount = async () => {
    try {
      const res = await api.get('/items')
      if (res.data.success) {
        const withImages = res.data.data.filter((i: any) => i.image_path)
        setImageCount(withImages.length)
      }
    } catch (e) {}
  }

  const handleSaveDays = async () => {
    setSavingDays(true)
    try {
      await api.put('/settings', { reminder_days: String(reminderDays) })
      message.success('提醒天数已更新~')
      refresh()
    } catch (e) { message.error('保存失败') } finally { setSavingDays(false) }
  }

  const handleAddCat = async () => {
    if (!newCatName.trim()) return
    try {
      const res = await api.post('/categories', { name: newCatName.trim() })
      if (res.data.success) { message.success('分类已添加~'); setNewCatName(''); refresh() }
      else { message.error(res.data.error) }
    } catch (e) { message.error('添加失败') }
  }

  const handleEditCat = async () => {
    if (!editingCat || !editCatName.trim()) return
    try {
      const res = await api.put(`/categories/${editingCat.id}`, { name: editCatName.trim() })
      if (res.data.success) { message.success('分类已更新~'); setEditingCat(null); refresh() }
      else { message.error(res.data.error) }
    } catch (e) { message.error('更新失败') }
  }

  const handleDeleteCat = async (id: number) => {
    try {
      const res = await api.delete(`/categories/${id}`)
      if (res.data.success) { message.success('分类已删除'); refresh() }
      else { message.error(res.data.error) }
    } catch (e) { message.error('删除失败') }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <SettingOutlined style={{ fontSize: 26, color: '#FF9A76' }} />
          <Title level={3} style={{ margin: 0, color: '#5C4033' }}>设置</Title>
        </div>
      </motion.div>

      {/* 字体大小 */}
      <motion.div variants={itemVariant} custom={0} initial="hidden" animate="visible">
        <Card className="warm-card" title={<span style={{ color: '#5C4033' }}><FontSizeOutlined /> 字体大小</span>}
          style={{ marginBottom: 24 }}>
          <Space align="center" wrap>
            <Text style={{ color: '#5C4033' }}>界面字号：</Text>
            <Segmented
              value={fontSize}
              onChange={(v) => handleSaveFont(v as string)}
              options={fontOptions}
              disabled={savingFont}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {fontSize === 'normal' ? '适合日常使用' : fontSize === 'large' ? '适合长辈阅读' : '适合视力较弱的长辈'}
            </Text>
          </Space>
        </Card>
      </motion.div>

      {/* 推送通知 */}
      <motion.div variants={itemVariant} custom={0} initial="hidden" animate="visible">
        <Card className="warm-card" title={<span style={{ color: '#5C4033' }}><BellOutlined /> 过期推送提醒</span>}
          style={{ marginBottom: 24 }}>
          <Space align="center" wrap>
            <Text style={{ color: '#5C4033' }}>浏览器推送通知：</Text>
            <Segmented
              value={pushEnabled ? 'on' : 'off'}
              onChange={(v) => handleTogglePush(v === 'on')}
              options={[
                { label: '关闭', value: 'off' },
                { label: '开启', value: 'on' },
              ]}
              disabled={pushLoading}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {pushEnabled ? '物品即将过期时会推送通知提醒' : '开启后可接收过期提醒推送'}
            </Text>
          </Space>
        </Card>
      </motion.div>

      {/* 提醒天数 */}
      <motion.div variants={itemVariant} custom={0} initial="hidden" animate="visible">
        <Card className="warm-card" title={<span style={{ color: '#5C4033' }}>过期提醒设置</span>}
          style={{ marginBottom: 24 }}>
          <Space align="center" wrap>
            <Text style={{ color: '#5C4033' }}>提前</Text>
            <InputNumber min={1} max={365} value={reminderDays}
              onChange={v => setReminderDays(v || 7)}
              style={{ width: 80, borderRadius: 12 }} />
            <Text style={{ color: '#5C4033' }}>天提醒即将过期的物品</Text>
            <Button type="primary" loading={savingDays} onClick={handleSaveDays}
              className="warm-btn-primary" size="small">保存</Button>
          </Space>
        </Card>
      </motion.div>

      {/* 分类管理 */}
      <motion.div variants={itemVariant} custom={1} initial="hidden" animate="visible">
        <Card className="warm-card" title={<span style={{ color: '#5C4033' }}>分类管理</span>}
          style={{ marginBottom: 24 }}>
          <List
            dataSource={categories}
            renderItem={(cat: any, i: number) => (
              <motion.div custom={i + 2} variants={itemVariant} initial="hidden" animate="visible">
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #FFF0E6' }}
                  actions={[
                    <Button size="small" icon={<EditOutlined />}
                      onClick={() => { setEditingCat(cat); setEditCatName(cat.name) }}
                      style={{ borderRadius: 12 }} />,
                    <Popconfirm title="确认删除该分类？" description="如分类下有物品将无法删除"
                      onConfirm={() => handleDeleteCat(cat.id)}>
                      <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 12 }} />
                    </Popconfirm>,
                  ]}>
                  {editingCat && editingCat.id === cat.id ? (
                    <Space>
                      <Input value={editCatName} onChange={e => setEditCatName(e.target.value)}
                        style={{ width: 160, borderRadius: 12 }} />
                      <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleEditCat}
                        style={{ borderRadius: 12 }} />
                      <Button size="small" onClick={() => setEditingCat(null)} style={{ borderRadius: 12 }}>取消</Button>
                    </Space>
                  ) : (
                    <Text style={{ color: '#5C4033', fontSize: 15 }}>{cat.name}</Text>
                  )}
                </List.Item>
              </motion.div>
            )}
          />
          <Divider style={{ margin: '16px 0', borderColor: '#FFE8D6' }} />
          <Space>
            <Input value={newCatName} onChange={e => setNewCatName(e.target.value)}
              placeholder="新分类名称" style={{ width: 160, borderRadius: 12 }}
              onPressEnter={handleAddCat} />
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddCat}
              style={{ borderRadius: 12, borderColor: '#FF9A76', color: '#FF9A76' }}>
              添加分类
            </Button>
          </Space>
        </Card>
      </motion.div>

      {/* 存储管理 */}
      <motion.div variants={itemVariant} custom={3} initial="hidden" animate="visible">
        <Card className="warm-card" title={<span style={{ color: '#5C4033' }}>存储管理</span>}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SmileOutlined style={{ fontSize: 28, color: '#FFD8C0' }} />
            <div>
              <Text style={{ color: '#5C4033', fontSize: 16 }}>上传图片数量：{imageCount} 张</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>图片保存在 uploads/ 目录</Text>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
