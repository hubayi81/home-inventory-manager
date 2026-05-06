import { useState, useEffect } from 'react'
import { Button, Card, Typography } from 'antd'
import { DownloadOutlined, CloseOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'

const { Text } = Typography

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // 检查是否已安装
      if (window.matchMedia('(display-mode: standalone)').matches) return
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ marginBottom: 24 }}
        >
          <Card
            style={{
              background: 'linear-gradient(135deg, #FF9A76, #fec89a)',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 4px 20px rgba(255,154,118,0.3)',
            }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text strong style={{ color: '#fff', fontSize: 16 }}>
                  安装到手机桌面
                </Text>
                <br />
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                  像 App 一样使用，更方便哦~
                </Text>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleInstall}
                  style={{ borderRadius: 20, border: 'none', color: '#FF9A76', fontWeight: 500 }}
                >
                  立即安装
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => setShow(false)}
                  style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.5)', color: '#fff',
                    background: 'transparent' }}
                  size="small"
                />
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
