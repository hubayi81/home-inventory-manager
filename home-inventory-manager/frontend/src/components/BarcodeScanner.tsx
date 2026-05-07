import { useState, useRef, useEffect } from 'react'
import { Button, Modal, Typography, Space } from 'antd'
import { BarcodeOutlined, ScanOutlined, StopOutlined } from '@ant-design/icons'

const { Text } = Typography

const BARCODE_STORE_KEY = 'barcode_name_map'

function getBarcodeMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(BARCODE_STORE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveBarcodeMap(map: Record<string, string>) {
  localStorage.setItem(BARCODE_STORE_KEY, JSON.stringify(map))
}

interface Props {
  onDetected: (barcode: string, nameHint: string) => void
}

export default function BarcodeScanner({ onDetected }: Props) {
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<any>(null)

  const startScan = async () => {
    const { Html5Qrcode } = await import('html5-qrcode')
    const el = document.getElementById('barcode-reader')
    if (!el) return

    const scanner = new Html5Qrcode('barcode-reader')
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 140 } },
        (decoded: string) => {
          const map = getBarcodeMap()
          const known = map[decoded]
          onDetected(decoded, known || decoded)
          scanner.stop().catch(() => {})
          setScanning(false)
        },
        () => {}
      )
      setScanning(true)
    } catch (err: any) {
      console.error('Camera error:', err)
      setScanning(false)
    }
  }

  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (e) {}
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <>
      <Button
        icon={<BarcodeOutlined />}
        onClick={startScan}
        style={{ borderRadius: '0 12px 12px 0', height: '100%' }}
      >
        扫码
      </Button>

      <Modal
        title={
          <Space>
            <ScanOutlined style={{ color: '#FF9A76' }} />
            <span>扫描商品条形码</span>
          </Space>
        }
        open={scanning}
        onCancel={stopScan}
        footer={
          <Button icon={<StopOutlined />} danger onClick={stopScan} style={{ borderRadius: 12 }}>
            停止扫描
          </Button>
        }
        destroyOnClose
      >
        <div id="barcode-reader" style={{ width: '100%', minHeight: 240 }} />
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12 }}>
          将条形码对准框内，自动识别。扫描过一次的商品下次扫会记住名称。
        </Text>
      </Modal>
    </>
  )
}

/** 保存条码→名称映射，下次扫描同一商品时自动填充 */
export function rememberBarcodeName(barcode: string, name: string) {
  if (!barcode || !name) return
  const map = getBarcodeMap()
  map[barcode] = name
  saveBarcodeMap(map)
}
