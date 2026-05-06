import { useState } from 'react'
import {
  Card, Form, Input, Select, InputNumber, DatePicker, Button,
  Alert, Space, Tag, Typography, Row, Col, Spin, Upload,
} from 'antd'
import { CameraOutlined, InboxOutlined, EditOutlined, SmileOutlined } from '@ant-design/icons'
import type { RcFile } from 'antd/es/upload'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import api from '../api'
import { useAppContext } from '../contexts/AppContext'
import VoiceInput from '../components/VoiceInput'

const { Title, Text } = Typography
const { Dragger } = Upload


export default function AddItem() {
  const { categories, refresh } = useAppContext()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('')
  const [imagePath, setImagePath] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [duplicate, setDuplicate] = useState<any>(null)

  const handleUpload = async (file: RcFile) => {
    setUploading(true)
    setUploadError('')
    setSuggestions([])
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.data.success) {
        setSuggestions(res.data.data.suggestions)
        setImagePath(res.data.data.image_path)
        if (res.data.data.suggestions.length === 0) {
          setUploadError('AI 未识别到物品，请手动输入名称')
        }
      }
    } catch (e) {
      setUploadError('上传失败，请重试')
    } finally {
      setUploading(false)
    }
    return false
  }

  const pickSuggestion = (name: string) => {
    setSelectedSuggestion(name)
    form.setFieldsValue({ name })
  }

  const handleManualSubmit = async (values: any) => {
    try {
      const res = await api.post('/items', {
        ...values,
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : null,
      })
      if (res.data.duplicate) { setDuplicate(res.data); return }
      if (res.data.success) { refresh(); form.resetFields(); navigate('/items') }
    } catch (e) { console.error(e) }
  }

  const handlePhotoSubmit = async (values: any) => {
    try {
      await api.post('/items/from-photo', {
        ...values, image_path: imagePath,
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : null,
      })
      refresh(); form.resetFields()
      setSuggestions([]); setImagePath(''); setSelectedSuggestion('')
      navigate('/items')
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <SmileOutlined style={{ fontSize: 26, color: '#FF9A76' }} />
          <Title level={3} style={{ margin: 0, color: '#5C4033' }}>添加物品</Title>
        </div>
      </motion.div>

      <Row gutter={24}>
        {/* 拍照上传 */}
        <Col xs={24} lg={12}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <Card className="warm-card" title={<span style={{ color: '#5C4033' }}><CameraOutlined /> 拍照识别添加</span>}>
              <Dragger
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleUpload}
                disabled={uploading}
                style={{
                  borderRadius: 16,
                  border: '2px dashed #FFD8C0',
                  background: '#FFFBF7',
                }}
              >
                <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
                  <InboxOutlined style={{ fontSize: 40, color: '#FF9A76' }} />
                </p>
                <p className="ant-upload-text" style={{ color: '#5C4033', fontSize: 15 }}>点击或拖拽上传图片</p>
                <p className="ant-upload-hint" style={{ color: '#B8A090' }}>支持 jpg、png 格式，AI 智能识别物品</p>
              </Dragger>

              {uploading && <div style={{ marginTop: 12, textAlign: 'center' }}>
                <Spin tip="AI 识别中..." />
              </div>}

              {uploadError && <Alert message={uploadError} type="warning" style={{ marginTop: 12, borderRadius: 12 }} showIcon />}

              {suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 16 }}>
                  <Text strong style={{ color: '#5C4033' }}>AI 识别建议：</Text>
                  <div style={{ marginTop: 8 }}>
                    {suggestions.map(s => (
                      <Tag.CheckableTag
                        key={s}
                        checked={selectedSuggestion === s}
                        onChange={() => pickSuggestion(s)}
                        style={{
                          fontSize: 14, marginBottom: 8, padding: '6px 16px',
                          borderRadius: 20, border: '1px solid #FFD8C0',
                          background: selectedSuggestion === s ? '#FFF0E6' : '#fff',
                        }}
                      >{s}</Tag.CheckableTag>
                    ))}
                  </div>
                  <Form form={form} layout="vertical" onFinish={handlePhotoSubmit} style={{ marginTop: 16 }}>
                    <Form.Item name="name" label="物品名称" rules={[{ required: true }]}>
                      <Input placeholder="选择建议或手动输入" style={{ borderRadius: 12 }}
                        suffix={<VoiceInput onResult={(text) => form.setFieldsValue({ name: text })} />}
                      />
                    </Form.Item>
                    <Form.Item name="category_id" label="分类" rules={[{ required: true }]}>
                      <Select placeholder="选择分类" style={{ borderRadius: 12 }}
                        options={categories.map(c => ({ label: c.name, value: c.id }))} />
                    </Form.Item>
                    <Form.Item name="quantity" label="数量" initialValue={1}>
                      <InputNumber min={1} style={{ width: '100%', borderRadius: 12 }} />
                    </Form.Item>
                    <Form.Item name="expiry_date" label="过期日期（可选）">
                      <DatePicker style={{ width: '100%', borderRadius: 12 }} />
                    </Form.Item>
                    <Form.Item name="notes" label="备注（可选）">
                      <Input.TextArea rows={2} style={{ borderRadius: 12 }} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block className="warm-btn-primary">
                      确认添加
                    </Button>
                  </Form>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </Col>

        {/* 手动录入 */}
        <Col xs={24} lg={12}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <Card className="warm-card" title={<span style={{ color: '#5C4033' }}><EditOutlined /> 手动录入</span>}>
              {duplicate && (
                <Alert message={duplicate.message} type="info" showIcon closable
                  onClose={() => setDuplicate(null)} style={{ marginBottom: 16, borderRadius: 12 }} />
              )}
              <Form form={form} layout="vertical" onFinish={handleManualSubmit}>
                <Form.Item name="name" label="物品名称" rules={[{ required: true, message: '请输入物品名称' }]}>
                  <Input placeholder="如：酱油、牛奶" style={{ borderRadius: 12 }}
                    suffix={<VoiceInput onResult={(text) => form.setFieldsValue({ name: text })} />}
                  />
                </Form.Item>
                <Form.Item name="category_id" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                  <Select placeholder="选择分类" style={{ borderRadius: 12 }}
                    options={categories.map(c => ({ label: c.name, value: c.id }))} />
                </Form.Item>
                <Form.Item name="quantity" label="数量" initialValue={1}>
                  <InputNumber min={1} style={{ width: '100%', borderRadius: 12 }} />
                </Form.Item>
                <Form.Item name="expiry_date" label="过期日期（可选）">
                  <DatePicker style={{ width: '100%', borderRadius: 12 }} />
                </Form.Item>
                <Form.Item name="notes" label="备注（可选）">
                  <Input.TextArea rows={2} placeholder="如品牌、规格等" style={{ borderRadius: 12 }} />
                </Form.Item>
                <Button type="primary" htmlType="submit" block className="warm-btn-primary">
                  添加物品
                </Button>
              </Form>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </div>
  )
}
