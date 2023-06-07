import { Box, CircularProgress } from '@mui/material'
import React from 'react'

export default function FullPageLoading() {
  return (
    <Box sx={{width: '100%', height: 'calc(100vh - 72px)', display: 'flex', flexGrow: 1, alignItems:'center', justifyContent: 'center'}}>
        <CircularProgress />
    </Box>
  )
}
