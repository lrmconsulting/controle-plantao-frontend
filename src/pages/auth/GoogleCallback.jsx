/**
 * GoogleCallback.jsx
 *
 * Página intermediária aberta pelo popup de OAuth2 do Google.
 * O backend redireciona para /auth/google-callback?status=success|error&message=...
 * Esta página lê o resultado, envia uma mensagem para a janela pai e fecha o popup.
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'

export default function GoogleCallback() {
  const [searchParams] = useSearchParams()
  const [done, setDone] = useState(false)

  const callbackStatus = searchParams.get('status')   // 'success' | 'error'
  const message = searchParams.get('message') || ''
  const isSuccess = callbackStatus === 'success'

  useEffect(() => {
    // Envia resultado para a janela pai (Ajustes.jsx)
    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'GOOGLE_OAUTH_CALLBACK',
          status: callbackStatus,
          message: decodeURIComponent(message),
        },
        window.location.origin
      )
    }

    setDone(true)

    // Fecha o popup após um pequeno delay (permite que o usuário veja o feedback)
    const timer = setTimeout(() => {
      window.close()
    }, 2000)

    return () => clearTimeout(timer)
  }, [callbackStatus, message])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      {!done ? (
        <CircularProgress size={40} />
      ) : isSuccess ? (
        <>
          <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main' }} />
          <Typography variant="h6" fontWeight={600}>
            Google Calendar conectado!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta janela será fechada automaticamente…
          </Typography>
        </>
      ) : (
        <>
          <ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.main' }} />
          <Typography variant="h6" fontWeight={600}>
            Falha na conexão
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={320}>
            {message || 'Não foi possível conectar ao Google Calendar. Tente novamente.'}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Esta janela será fechada automaticamente…
          </Typography>
        </>
      )}
    </Box>
  )
}
