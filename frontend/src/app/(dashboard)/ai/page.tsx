'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Chip, Avatar,
  CircularProgress, Divider, Alert, IconButton, Tooltip,
} from '@mui/material';
import { Send, Psychology, Person, Delete, SmartToy } from '@mui/icons-material';
import { aiApi } from '@/services/api';
import { useSnackbar } from 'notistack';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'Como resolver um erro OAuth 401 no SAP Ariba?',
  'O que significa IDoc status 51?',
  'Como configurar o CIG para enviar uma PO para o SAP?',
  'Quais são os campos obrigatórios em um cXML OrderRequest?',
  'Como depurar um problema de mapeamento XSL no CIG?',
];

export default function AiPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o Especialista IA em SAP Ariba. Posso te ajudar com:\n\n• APIs REST SAP Ariba (Sourcing, Contracts, Buying, Commerce Automation)\n• OAuth 2.0 e autenticação\n• Payloads XML cXML e JSON\n• SAP CIG: mapeamentos, XSL, XPath\n• IDocs SAP (WE02, WE05, BD87, SLG1)\n• Troubleshooting de integrações B2B\n\nComo posso ajudar?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMsg: Message = { role: 'user', content: messageText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res: any = await aiApi.chat(
        [{ role: 'user', content: messageText }],
        history,
      );

      const assistantMsg: Message = {
        role: 'assistant',
        content: res.message || 'Não foi possível obter resposta.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Erro ao comunicar com a IA';
      enqueueSnackbar(errorMsg, { variant: 'error' });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Erro ao processar sua mensagem. Verifique se a GEMINI_API_KEY está configurada no .env.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Conversa reiniciada. Como posso ajudar?',
      timestamp: new Date(),
    }]);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h5" fontWeight="bold">IA Troubleshooting</Typography>
          <Typography variant="body2" color="text.secondary">
            Especialista em SAP Ariba, CIG, IDocs e integrações B2B
          </Typography>
        </Box>
        <Tooltip title="Limpar conversa">
          <IconButton onClick={clearChat} size="small"><Delete /></IconButton>
        </Tooltip>
      </Box>

      {/* Quick prompts */}
      <Box display="flex" gap={1} flexWrap="wrap">
        {QUICK_PROMPTS.map((p, i) => (
          <Chip
            key={i}
            label={p}
            size="small"
            variant="outlined"
            clickable
            onClick={() => sendMessage(p)}
            sx={{ fontSize: 11 }}
          />
        ))}
      </Box>

      {/* Chat area */}
      <Card sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((msg, i) => (
            <Box
              key={i}
              display="flex"
              gap={1.5}
              flexDirection={msg.role === 'user' ? 'row-reverse' : 'row'}
              alignItems="flex-start"
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                  flexShrink: 0,
                }}
              >
                {msg.role === 'user' ? <Person sx={{ fontSize: 18 }} /> : <SmartToy sx={{ fontSize: 18 }} />}
              </Avatar>

              <Box
                sx={{
                  maxWidth: '75%',
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                  border: msg.role === 'assistant' ? '1px solid' : 'none',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1.5,
                  boxShadow: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                >
                  {msg.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.6,
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                  }}
                >
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          ))}

          {loading && (
            <Box display="flex" gap={1.5} alignItems="flex-start">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', flexShrink: 0 }}>
                <SmartToy sx={{ fontSize: 18 }} />
              </Avatar>
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">Analisando...</Typography>
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            size="small"
            placeholder="Descreva o problema SAP Ariba... (Enter para enviar, Shift+Enter para quebrar linha)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            sx={{ minWidth: 0, px: 2, py: 1 }}
          >
            <Send />
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
