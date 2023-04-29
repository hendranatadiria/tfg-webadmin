/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Autocomplete, Box, Button, Card, CircularProgress, Container, Grid, TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { DateRangePicker } from 'rsuite';
import { api } from '~/utils/api';
import 'rsuite/dist/rsuite.min.css'; // or 'rsuite/dist/rsuite.min.css'
import { DateTime } from 'luxon';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    TimeSeriesScale,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
import 'chartjs-adapter-luxon';
import Link from 'next/link';

type IProps = Record<string, never>;
export default function Dashboard(_props) {
    const options = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top' as const,
          },
        },
        scales: {
            x: {
                type: 'timeseries',
                ticks: {
                    callback: (value:number) => {
                        return DateTime.fromMillis(value).toFormat('HH:mm');
                    }
                }
            },
        }
      };

    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        TimeSeriesScale,
        Title,
        Tooltip,
        Legend
      );

    const [hasInit, setHasInit] = useState<boolean>(false);
    const [series, setSeries] = useState<{label: string, data: {x: Date, y: number}[]}[]>([]);
    const [seriesLiquid, setSeriesLiquid] = useState<{label: string, data: {x: Date, y: number|null}[]}[]>([]);
    const [startDate, setStartDate] = useState<Date>(DateTime.now().minus({days: 7}).startOf('day').toJSDate());
    const [endDate, setEndDate] = useState<Date>(DateTime.now().toJSDate());
    const [deviceId, setDeviceId] = useState<string>('');


    const tempQuery = api.temperature.getTemperatureLogs.useQuery({deviceId, startDate, endDate}, {
        enabled: (deviceId !==undefined), 
        refetchOnWindowFocus: false});
    const liquidQuery = api.liquidLevel.getBucketedLevelLogs.useQuery({deviceId, startDate, endDate}, {
        enabled: (deviceId !==undefined), 
        refetchOnWindowFocus: false});
    const deviceQuery = api.device.getAllDevices.useQuery(undefined, {refetchOnWindowFocus: false});
    const lastRefillQuery = api.liquidLevel.getLastRefill.useQuery({deviceId}, {
        enabled: (deviceId !==undefined), 
        refetchOnWindowFocus: false});
    const refillEstimateQuery = api.liquidLevel.getRefillEstimate.useQuery({deviceId}, {
        enabled: (deviceId !==undefined && lastRefillQuery.data !== null && lastRefillQuery.data !==undefined && lastRefillQuery.status == 'success'), 
        refetchOnWindowFocus: false});

    const refetchAll = () => {
        void tempQuery.refetch();
        void liquidQuery.refetch();
        void lastRefillQuery.refetch();
        void refillEstimateQuery.refetch();
    };

    useEffect(() => {
        if (tempQuery.data) {
            const data = tempQuery.data.tempData.map((item) => {
                return {
                    x: item.timestamp,
                    y: item.value
                }
            })
            setSeries([{
                label: "Temperature",
                data: data
            }]);
        }
    }, [tempQuery.data])
    useEffect(() => {
        if (liquidQuery.data) {
            console.log(liquidQuery.data.bucketedData);
            const data = liquidQuery.data.bucketedData.map((item) => {
                return {
                    x: item.bucket,
                    y: item.avgLevel
                }
            })
            setSeriesLiquid([{
                label: "Liquid Level",
                data: data
            }]);
        }
    }, [liquidQuery.data])

    useEffect(() => {
        if (deviceQuery.data) {
            setDeviceId(deviceQuery.data[0]?.id??'');
        }
    }, [deviceQuery.data])

    useEffect(() => {
        if (lastRefillQuery.data !== null && lastRefillQuery.data !==undefined && !hasInit) {
            setStartDate(lastRefillQuery.data.timestamp);
            setHasInit(true);
            refetchAll();
        }
    }, [lastRefillQuery.data])

  return (
    <Container maxWidth="xl" sx={{pt:5, mb:10}}>
        <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={6}>
            <Box>
                <Typography variant="h4">Dashboard</Typography>
                <Typography variant="body1">Cloud-Connected Smart Hand Sanitizer Dispenser Data</Typography>
            </Box>
            </Grid>
            <Grid item xs={12} md={3}>
                <Card variant='outlined' sx={{p:2}}>
                    <Typography variant="body1">Last Refill/Starting Data</Typography>
                    <Typography variant="h4">{lastRefillQuery.status == 'success' ? (lastRefillQuery.data !== undefined && lastRefillQuery.data !== null ? DateTime.fromJSDate(lastRefillQuery.data.timestamp).toRelative(): 'No Data' ): (lastRefillQuery.status == 'loading' ? <CircularProgress size={20} />: 'Error')} </Typography>
                    <Typography variant="body1">{lastRefillQuery.status == 'success' ? (lastRefillQuery.data !== undefined && lastRefillQuery.data !== null ? DateTime.fromJSDate(lastRefillQuery.data.timestamp).toFormat('dd LLL yyyy HH:mm'): 'No Data' ): (lastRefillQuery.status == 'loading' ? '': lastRefillQuery.error.message)}</Typography>
                </Card>
            </Grid>
            <Grid item xs={12} md={3}>
                <Card variant='outlined' sx={{p:2}}>
                    <Typography variant="body1">Next Refill Estimation</Typography>
                    <Typography variant="h4">{refillEstimateQuery.status == 'success' ? (refillEstimateQuery.data !== undefined && refillEstimateQuery.data !== null ? DateTime.fromJSDate(refillEstimateQuery.data.tOnValue).toRelative(): 'No Data') : (refillEstimateQuery.status == 'loading' ? <CircularProgress size={20} />: 'Error')}</Typography>
                    <Typography variant="body1">{refillEstimateQuery.status == 'success' ? (refillEstimateQuery.data !== undefined && refillEstimateQuery.data !== null ? DateTime.fromJSDate(refillEstimateQuery.data.tOnValue).toFormat('dd LLL yyyy HH:mm'): 'No Data') : (refillEstimateQuery.status == 'loading' ? '': refillEstimateQuery.error.message)}</Typography>
                </Card>
            </Grid>
        </Grid>
        <Typography variant="h6" sx={{pt:5}}>Filter Report</Typography>
        <Grid container spacing={2} sx={{pt:2}}>
            <Grid item xs={12} md={4}>
            <Autocomplete
                disablePortal
                fullWidth
                value={deviceId}
                id="combo-box-demo"
                options={deviceQuery.data !== undefined? deviceQuery.data.map(el => el.id) : []}
                onChange={(event, newValue) => {
                    if (newValue === null) {
                        setDeviceId('');
                        return;
                    }
                    setDeviceId(newValue);
                    setTimeout(() => {
                        void tempQuery.refetch();
                        void liquidQuery.refetch();
                    }, 100);
                }}
                renderInput={(params) => <TextField {...params} size='small' fullWidth label="Device ID" />}
                />
            </Grid>
            <Grid item xs={12} md={4}>
            <DateRangePicker
                block
                format="dd-MM-yyyy HH:mm"
                size='lg'
                value={[startDate, endDate]}
                placeholder="Select Data Period Range"
                defaultCalendarValue={[DateTime.now().minus({days: 7}).startOf('day').toJSDate(), DateTime.now().toJSDate()]}
                onClean={() => {
                    setStartDate(lastRefillQuery.data? lastRefillQuery.data.timestamp : DateTime.now().minus({days: 7}).startOf('day').toJSDate());
                    refetchAll();
                }}
                onChange={(value) => {
                    console.log(value)
                    if (value === null) {
                        return;
                    }
                    setStartDate(value[0]);
                    setEndDate(value[1]);
                    // set timer for 100ms to wait for the state to be updated
                    setTimeout(() => {
                        void tempQuery.refetch();
                        void liquidQuery.refetch();
                    }, 100);
                }}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <Button variant="contained" onClick={refetchAll} disabled={liquidQuery.status == 'loading' || tempQuery.status == 'loading'} fullWidth>Refresh &nbsp; {(liquidQuery.status == 'loading' || tempQuery.status == 'loading') && <CircularProgress size={18} />}</Button>
            </Grid>
        </Grid>
        <Grid container spacing={2} sx={{pt:5}}>
            <Grid item xs={12} 
            // md={6}
            >
                <Box display='flex' justifyContent='space-between'>
                    <Typography variant="h6">Liquid Level {liquidQuery.status === 'loading' && <CircularProgress size={20} />}</Typography>
                    <Link href={`/logs/level?deviceId=${deviceId}`}>Show Log</Link>
                </Box>
                <Line options={options} data={{
                    labels: liquidQuery.data?.bucketedData.map((el: { bucket: Date; }) => DateTime.fromJSDate(el.bucket).toJSDate()) ?? [],
                    datasets:[
                        {
                            label: "Liquid Level",
                            data: liquidQuery.data?.bucketedData.map((el: { avgLevel: number | null; }) => el.avgLevel) ?? [],
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgb(255, 99, 132)',
                        }
                    ]}} redraw></Line>
            </Grid>
            <Grid item xs={12}
            // md={6}
            >
                <Box display='flex' justifyContent='space-between'>
                    <Typography variant="h6" sx={{pt:5}}>Temperature {tempQuery.status === 'loading' && <CircularProgress size={20} />}</Typography>
                    <Link href={`/logs/temperature?deviceId=${deviceId}`}>Show Log</Link>
                </Box>
                <Line options={options} data={{
                    labels: tempQuery.data?.tempData.map((el: { timestamp: Date; }) => el.timestamp) ?? [],
                    datasets:[
                        {
                            label: "Temperature Data",
                            data: tempQuery.data?.tempData.map((el: { value: number | null; }) => el.value) ?? [],
                            borderColor: 'rgb(53, 162, 235)',
                            backgroundColor: 'rgb(53, 162, 235)',
                        }
                    ]}} redraw></Line>
            </Grid>
        
        </Grid>
    </Container>
  )
}
