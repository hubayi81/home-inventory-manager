import { useState, useRef, useCallback } from 'react'
import { Button, Tooltip } from 'antd'
import { AudioOutlined, AudioMutedOutlined } from '@ant-design/icons'

interface VoiceInputProps {
  onResult: (text: string) => void
  disabled?: boolean
}

export default function VoiceInput({ onResult, disabled }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef<any>(null)

  const isSupported = !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  )

  const startListening = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let final = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interimText += transcript
        }
      }
      if (final) {
        onResult(final)
        setInterim('')
      } else {
        setInterim(interimText)
      }
    }

    recognition.onerror = () => {
      setListening(false)
      setInterim('')
    }

    recognition.onend = () => {
      setListening(false)
      setInterim('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [isSupported, onResult])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setListening(false)
    setInterim('')
  }, [])

  if (!isSupported) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Tooltip title={listening ? '点击停止' : '语音输入'}>
        <Button
          icon={listening ? <AudioMutedOutlined /> : <AudioOutlined />}
          onClick={listening ? stopListening : startListening}
          disabled={disabled}
          type={listening ? 'primary' : 'default'}
          danger={listening}
          shape="circle"
          style={{
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Tooltip>
      {listening && interim && (
        <span style={{
          color: '#FF9A76',
          fontSize: 13,
          fontStyle: 'italic',
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          {interim}
        </span>
      )}
    </div>
  )
}
