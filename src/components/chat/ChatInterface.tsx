'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage, UserProfile, ParsedResumeResult, SkillGapResult, CVAttachment } from '@/types'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput, ChatInputHandle } from '@/components/chat/ChatInput'
import { StarterCards } from '@/components/chat/StarterCards'
import { QuickActions } from '@/components/chat/QuickActions'
import { pdfToImages, extractTextFromFile } from '@/lib/pdf-utils'
import { touchConversation } from '@/lib/conversation-store'

interface ChatInterfaceProps {
  threadId: string
  onProfileUpdate: (profile: Partial<UserProfile>) => void
  onSkillGapResult: (result: SkillGapResult) => void
  onCVUploaded: (attachment: CVAttachment) => void
  onTitleGenerated: (threadId: string, title: string) => void
}

const initialWelcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `مرحباً! I'm your **Localized AI Career Coach**, specialized in MENA job markets and career opportunities across the GCC.\n\nUpload your CV for instant analysis, or tell me about your background and goals — I'll map your skill gaps, build a learning path, and connect you with expert mentors.`,
  toolResults: [],
  segments: [{ type: 'text', content: `مرحباً! I'm your **Localized AI Career Coach**, specialized in MENA job markets and career opportunities across the GCC.\n\nUpload your CV for instant analysis, or tell me about your background and goals — I'll map your skill gaps, build a learning path, and connect you with expert mentors.` }]
}

export function ChatInterface({ threadId, onProfileUpdate, onSkillGapResult, onCVUploaded, onTitleGenerated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage])
  const [isLoading, setIsLoading] = useState(false)
  const [showStarterCards, setShowStarterCards] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<ChatInputHandle>(null)
  const messagesRef = useRef<ChatMessage[]>([initialWelcomeMessage])
  const titleFiredRef = useRef(false)

  // Restore messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`localized_messages_${threadId}`)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[]
        if (parsed.length > 0) {
          setMessages(parsed)
          setShowStarterCards(false)
        }
      }
    } catch {
      // Ignore parse errors — start fresh
    }
  }, [threadId])

  // Persist messages to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(`localized_messages_${threadId}`, JSON.stringify(messages))
    } catch {
      // Ignore write errors (e.g. storage quota exceeded)
    }
  }, [messages, threadId])

  // Keep messagesRef in sync for post-stream title generation
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Reset title-fired guard when thread changes (guards against refresh mid-stream)
  useEffect(() => {
    titleFiredRef.current = false
  }, [threadId])

  // Re-embed CV markdown on mount if available (restores vector store after refresh)
  useEffect(() => {
    const markdown = localStorage.getItem(`localized_cv_markdown_${threadId}`)
    if (!markdown) return
    fetch('/api/embed-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown, threadId }),
    }).catch(() => {
      // Silent failure — agent will work without vector search
    })
  }, [threadId])

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  /** Stream /api/chat SSE into the last message in state (by assistantId). */
  const streamAgentResponse = async (
    messagesToSend: ChatMessage[],
    assistantId: string
  ) => {
    // Exclude the static welcome message — it's UI-only and should not be sent to the LLM
    const apiMessages = messagesToSend.filter(m => m.id !== 'welcome')
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages, threadId })
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed === 'data: [DONE]') { setIsLoading(false); continue }
        if (!trimmed.startsWith('data: ')) continue
        let event: { type: string; content?: string; name?: string; id?: string; result?: unknown; message?: string }
        try { event = JSON.parse(trimmed.slice('data: '.length)) } catch { continue }
        setMessages(prev => {
          const next = [...prev]
          const idx = next.findIndex(m => m.id === assistantId)
          if (idx === -1) return prev
          const last = { ...next[idx] }
          next[idx] = last
          if (event.type === 'text' && event.content) {
            last.content = last.content + event.content
            last.isScanning = false
            const segs = [...last.segments]
            const lastSeg = segs[segs.length - 1]
            if (lastSeg?.type === 'text') {
              segs[segs.length - 1] = { type: 'text', content: lastSeg.content + event.content }
            } else {
              segs.push({ type: 'text', content: event.content })
            }
            last.segments = segs
          } else if (event.type === 'tool_call' && event.id && event.name) {
            last.isScanning = false
            last.toolResults = [...last.toolResults, { id: event.id, toolName: event.name, status: 'loading', result: null }]
            last.segments = [...last.segments, { type: 'tool', toolResultId: event.id }]
          } else if (event.type === 'tool_result' && event.id) {
            last.toolResults = last.toolResults.map(tr =>
              tr.id === event.id ? { ...tr, status: 'done', result: event.result ?? null } : tr
            )
            if (event.name === 'update_profile') onProfileUpdate(event.result as Partial<UserProfile>)
            if (event.name === 'parse_resume') {
              const r = event.result as { profile?: Partial<UserProfile> }
              if (r?.profile) onProfileUpdate(r.profile)
            }
            if (event.name === 'skill_gap_analysis') onSkillGapResult(event.result as SkillGapResult)
          } else if (event.type === 'error' && event.message) {
            last.isScanning = false
            last.content = last.content + event.message
          }
          return next
        })
      }
    }
    if (buffer.trim() === 'data: [DONE]') setIsLoading(false)

    // Touch conversation to bump updatedAt in the list
    touchConversation(threadId)

    // Auto-title: fire once after first exchange (welcome + user + assistant = 3 messages)
    const currentMsgs = messagesRef.current
    if (!titleFiredRef.current && currentMsgs.length === 3) {
      titleFiredRef.current = true
      const firstUser = currentMsgs[1]?.content ?? ''
      const firstAssistant = currentMsgs[2]?.content ?? ''
      fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstUserMessage: firstUser, firstAssistantMessage: firstAssistant }),
      })
        .then(r => r.json())
        .then(({ title }: { title: string }) => { if (title) onTitleGenerated(threadId, title) })
        .catch(() => {})
    }
  }

  const sendMessage = async (content: string) => {
    setShowStarterCards(false)
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      toolResults: [],
      segments: []
    }
    const updatedMessages = [...messages, userMessage]
    setIsLoading(true)
    const assistantId = (Date.now() + 1).toString()
    const emptyAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolResults: [],
      segments: []
    }
    setMessages([...updatedMessages, emptyAssistant])
    await streamAgentResponse(updatedMessages, assistantId)
  }

  /** Vision-based PDF upload: renders pages to images, sends to /api/parse-cv, then embeds, then agent. */
  const handlePDFVision = async (file: File) => {
    setShowStarterCards(false)
    setIsLoading(true)

    // 1. Render PDF pages to images
    let pageImages: string[] = []
    let pageCount = 0
    try {
      const result = await pdfToImages(file)
      pageImages = result.images
      pageCount = result.pageCount
    } catch {
      try {
        const text = await extractTextFromFile(file)
        if (text.trim()) {
          await handleCVTextUpload(text, file.name)
        } else {
          await handleCVTextUpload(
            `[The file "${file.name}" could not be read. It may not be a valid PDF. Please export your CV as PDF from Word or Google Docs and try again.]`,
            file.name
          )
        }
      } catch {
        await handleCVTextUpload(
          `[The file "${file.name}" could not be read. Please make sure it is a valid PDF — export from Word or Google Docs as PDF and try again.]`,
          file.name
        )
      }
      setIsLoading(false)
      return
    }

    // 2. Snapshot current messages before we add new ones
    const previousMessages = messages

    // 3. Add user message with CV thumbnail + scanning assistant message
    const cvUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Uploaded CV: ${file.name}`,
      toolResults: [],
      segments: [],
      cvAttachment: { fileName: file.name, pageCount, pageImages }
    }
    const assistantId = (Date.now() + 1).toString()
    const scanningAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolResults: [],
      segments: [],
      isScanning: true
    }
    setMessages(prev => [...prev, cvUserMsg, scanningAssistant])
    onCVUploaded({ fileName: file.name, pageCount, pageImages })

    // 4. Call vision parse endpoint — retry once on failure to survive Vercel cold starts
    let parsedCV: Partial<ParsedResumeResult & { currentSkills: Array<{ name: string; currentLevel: number }> }> = {}
    const parseBody = JSON.stringify({ imageDataUrls: pageImages, fileName: file.name })
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/parse-cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: parseBody,
        })
        if (res.ok) {
          parsedCV = await res.json()
          if (parsedCV.profile) onProfileUpdate(parsedCV.profile)

          // 5. Embed the CV markdown for vector search (fire-and-forget, non-blocking)
          const markdown = parsedCV.markdownContent
          if (markdown) {
            // Save to localStorage for re-embed on refresh
            try {
              localStorage.setItem(`localized_cv_markdown_${threadId}`, markdown)
            } catch {}
            // Embed in background — don't await, agent call proceeds regardless
            fetch('/api/embed-cv', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ markdown, threadId }),
            }).catch(() => {})
          }
          break // success — no retry needed
        }
      } catch {
        // On first failure, retry immediately (cold start recovery)
        if (attempt === 1) break // second failure — continue without CV parse
      }
    }

    // 6. Build context message for agent
    const skillsList = (parsedCV as { currentSkills?: Array<{ name: string }> }).currentSkills
      ?.map((s: { name: string }) => s.name)
      .join(', ') ?? ''
    const summary = parsedCV.rawSummary ? `Vision analysis: ${parsedCV.rawSummary}` : ''
    const skillsLine = skillsList ? `Detected skills: ${skillsList}.` : ''
    const agentMessage =
      `I've uploaded my CV (${file.name}). ${summary} ${skillsLine} Please analyze my background, run a skill gap analysis for my target role, and give me a comprehensive career assessment.`.trim()

    // 7. Send to agent
    const agentTextMsg: ChatMessage = {
      id: cvUserMsg.id,
      role: 'user',
      content: agentMessage,
      toolResults: [],
      segments: []
    }
    await streamAgentResponse([...previousMessages, agentTextMsg], assistantId)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const name = file.name.toLowerCase()
    const isPDF = file.type === 'application/pdf' || name.endsWith('.pdf')
    const isDocx = file.type.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')

    if (isPDF) {
      await handlePDFVision(file)
    } else if (isDocx) {
      await handleCVTextUpload(
        `[Word document detected: "${file.name}". For best results, please export your CV as PDF from Word (File → Save As → PDF) or Google Docs (File → Download → PDF), then upload the PDF.]`,
        file.name
      )
    } else {
      try {
        const text = await extractTextFromFile(file)
        if (text.trim()) await handleCVTextUpload(text, file.name)
      } catch {
        await handleCVTextUpload(`[Could not extract text from ${file.name}. Please paste your CV text directly.]`, file.name)
      }
    }
  }

  const handleCVTextUpload = async (text: string, fileName: string) => {
    setShowStarterCards(false)
    const cvMessage = `I've uploaded my CV (${fileName}). Here is the content:\n\n${text.slice(0, 3000)}\n\nPlease analyze my background, extract my profile, then run a skill gap analysis for my target role.`
    await sendMessage(cvMessage)
  }

  // Kept for ChatInput compatibility (it passes text for .txt files dragged in)
  const handleCVUpload = async (text: string, fileName: string) => {
    await handleCVTextUpload(text, fileName)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-bg">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
      <MessageList messages={messages} />
      {showStarterCards && (
        <StarterCards
          onSend={sendMessage}
          onCVUpload={triggerFileUpload}
        />
      )}
      <QuickActions
        onInsert={(text) => chatInputRef.current?.insertText(text)}
        onCVUpload={triggerFileUpload}
        isLoading={isLoading}
      />
      <ChatInput
        ref={chatInputRef}
        onSend={sendMessage}
        isLoading={isLoading}
        onCVUpload={handleCVUpload}
      />
    </div>
  )
}
