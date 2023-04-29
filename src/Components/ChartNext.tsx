import dynamic from 'next/dynamic'

export const ChartNext = dynamic(() => import('react-apexcharts'), { ssr: false });