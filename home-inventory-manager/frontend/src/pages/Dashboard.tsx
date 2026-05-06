import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Typography, Progress } from 'antd'
import {
  InboxOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  AppstoreOutlined,
  SmileOutlined,
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import api from '../api'

const { Title, Text } = Typography

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
}

const categoryColors: Record<string, string> = {
  '食品': '#FF9A76', '饮料': '#74B9FF', '日用品': '#A8D8B9',
  '药品': '#FF7675', '零食': '#FAD02C', '其他': '#D4C4B7',
}

const statCards = [
  { key: 'total_items', title: '在库物品', icon: <InboxOutlined />, color: '#FF9A76', bg: '#FFF5EE' },
  { key: 'expiring_soon', title: '即将过期', icon: <WarningOutlined />, color: '#FAD02C', bg: '#FFFDE6' },
  { key: 'missing_items', title: '缺少物品', icon: <ShoppingCartOutlined />, color: '#FF7675', bg: '#FFF0F0' },
  { key: 'categories', title: '分类数', icon: <AppstoreOutlined />, color: '#A8D8B9', bg: '#F0FFF4' },
]

const warmSlogans = [
  '家里井井有条，生活清清爽爽 🏡',
  '每一件物品，都是家的温度 ✨',
  '好好照顾家里的每一样东西吧~',
  '温暖的家，从整理开始 🌸',
  '细心管理，让生活更从容 🍃',
  '有备无患，心中有数 💛',
]

export default function Dashboard() {
  const [stats, setStats] = useState<any>({})
  const [expiringItems, setExpiringItems] = useState<any[]>([])
  const [slogan] = useState(() => warmSlogans[Math.floor(Math.random() * warmSlogans.length)])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, expRes] = await Promise.all([
        api.get('/stats'),
        api.get('/items', { params: { expiring_soon: true, status: 'in_stock' } }),
      ])
      if (statsRes.data.success) setStats(statsRes.data.data)
      if (expRes.data.success) setExpiringItems(expRes.data.data)
    } catch (e) {
      console.error(e)
    }
  }

  const columns = [
    { title: '物品名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category_name', key: 'category', render: (v: string) => v || '-' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    {
      title: '过期日期', dataIndex: 'expiry_date', key: 'expiry_date',
      render: (v: string) => {
        if (!v) return '-'
        const daysLeft = dayjs(v).diff(dayjs(), 'day')
        return <span>{v} <Tag color={daysLeft <= 3 ? 'red' : 'orange'}>
          {daysLeft <= 0 ? '已过期' : `剩${daysLeft}天`}
        </Tag></span>
      },
    },
  ]

  const catList = stats.category_distribution || []
  const totalCat = catList.reduce((s: number, c: any) => s + c.count, 0)

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <SmileOutlined style={{ fontSize: 28, color: '#FF9A76' }} />
          <div>
            <Title level={3} style={{ margin: 0, color: '#5C4033' }}>仪表板</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>{slogan}</Text>
          </div>
        </div>
      </motion.div>

      {/* 统计卡片 */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF5EE 0%, #FFFBF7 50%, #FFF0E6 100%)',
        borderRadius: 20,
        padding: '20px 16px 4px',
        marginBottom: 24,
        border: '1px solid #FFE8D6',
      }}>
        <Row gutter={[16, 16]}>
          {statCards.map((card, i) => (
            <Col xs={24} sm={12} md={6} key={card.key}>
              <motion.div custom={i} variants={cardVariants} initial="hidden" animate="visible">
                <Card
                  className="warm-card"
                  style={{ background: card.bg, borderRadius: 16 }}
                >
                <Statistic
                  title={<Text style={{ color: '#8B7355', fontSize: 13 }}>{card.title}</Text>}
                  value={card.key === 'categories' ? catList.length : (stats[card.key] || 0)}
                  prefix={<span style={{ color: card.color, fontSize: 22 }}>{card.icon}</span>}
                  valueStyle={{ color: '#5C4033', fontSize: 28, fontWeight: 600 }}
                />
              </Card>
            </motion.div>
          </Col>
        ))}
        </Row>
      </div>

      <Row gutter={[24, 24]}>
        {/* 分类分布 */}
        <Col xs={24} md={10}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <Card className="warm-card" title={<Text strong style={{ color: '#5C4033' }}>分类分布</Text>}>
              {catList.length === 0 ? (
                <div className="empty-illustration">
                  <Text type="secondary">还没有添加物品哦~</Text>
                </div>
              ) : (
                catList.map((cat: any) => (
                  <div key={cat.name} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#5C4033' }}>{cat.name}</Text>
                      <Text style={{ color: '#8B7355' }}>{cat.count} 件</Text>
                    </div>
                    <Progress
                      percent={totalCat > 0 ? Math.round((cat.count / totalCat) * 100) : 0}
                      strokeColor={categoryColors[cat.name] || '#FF9A76'}
                      trailColor="#FFF0E6"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                ))
              )}
            </Card>
          </motion.div>
        </Col>

        {/* 即将过期物品 */}
        <Col xs={24} md={14}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
            <Card
              className="warm-card"
              title={<Text strong style={{ color: expiringItems.length > 0 ? '#FF7675' : '#5C4033' }}>
                {expiringItems.length > 0 ? '⚠️ 即将过期物品' : '即将过期物品'}
              </Text>}
            >
              <Table
                columns={columns}
                dataSource={expiringItems}
                rowKey="id"
                pagination={false}
                size="small"
                locale={{
                  emptyText: (
                    <div className="empty-illustration" style={{ padding: 30 }}>
                      <SmileOutlined style={{ fontSize: 40, color: '#A8D8B9', marginBottom: 12 }} />
                      <Text type="secondary">全部新鲜，没有即将过期的物品~</Text>
                    </div>
                  ),
                }}
              />
            </Card>
          </motion.div>
        </Col>
      </Row>
    </div>
  )
}
