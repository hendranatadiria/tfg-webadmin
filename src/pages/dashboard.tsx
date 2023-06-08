import { Autocomplete, Box, Button, Card, CircularProgress, Container, Grid, IconButton, TextField, Typography } from '@mui/material'
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
    type CoreChartOptions,
    type ElementChartOptions,
    type PluginChartOptions,
    type DatasetChartOptions,
    type ScaleChartOptions,
    type LineControllerChartOptions,
  } from 'chart.js';
import 'chartjs-adapter-luxon';
import Link from 'next/link';
import { type _DeepPartialObject } from 'chart.js/dist/types/utils';
import { ModelTraining } from '@mui/icons-material';
import Head from 'next/head';

export default function Dashboard() {
    const options: _DeepPartialObject<CoreChartOptions<"line"> 
        & ElementChartOptions<"line"> 
        & PluginChartOptions<"line"> 
        & DatasetChartOptions<"line"> 
        & ScaleChartOptions<"line">
        & LineControllerChartOptions>  = {
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
                    callback: (val:string|number) => {
                        const value = Number(val);
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
    const [hasInitEnd, setHasInitEnd] = useState<boolean>(false);
    const [forceRegress, setForceRegress] = useState<boolean>(false);
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
    // since the query is disabled if no refill query data, we can safely assume that the data is not null.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const refillEstimateQuery = api.liquidLevel.getRefillEstimate.useQuery({
        deviceId, lastRefillId: lastRefillQuery.data?.id,
        force: forceRegress
    }, {
        enabled: (deviceId !==undefined && lastRefillQuery.data !== null && lastRefillQuery.data !==undefined && lastRefillQuery.status == 'success'), 
        refetchOnWindowFocus: false});

    const refetchAll = () => {
        void tempQuery.refetch();
        void liquidQuery.refetch();
        void lastRefillQuery.refetch();
        void refillEstimateQuery.refetch();
    };

    const forceRetrain = async () => {
        setForceRegress(true);
        refetchAll();
        const promise = new Promise((resolve, reject) => {
            while (refillEstimateQuery.status !== 'success') {
            }
            if (refillEstimateQuery.status == 'success') {
                resolve(refillEstimateQuery.data);
            } else if (refillEstimateQuery.status == 'error') {
                reject(refillEstimateQuery.error);
            }
        });
        await promise;
        setForceRegress(false);
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastRefillQuery.data])

    useEffect(() => {
        if (refillEstimateQuery.data !== null && refillEstimateQuery.data !==undefined && refillEstimateQuery.status == 'success' && !hasInitEnd) {
            setEndDate(refillEstimateQuery.data.tOnValue);
            setHasInitEnd(true);
            refetchAll();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refillEstimateQuery.data])

  return (<>
    <Head>
        <title>Dashboard | Cloud-Connected Smart Hand Sanitizer Dispenser Web Admin</title>
    </Head>
    <Container maxWidth="xl" sx={{pt:5, mb:10}}>
        <Grid container spacing={2} alignItems='stretch'>
            <Grid item xs={12} md={3} >
            <Box display='flex' flexDirection='column' justifyContent='center' sx={{height: '100%'}}>
                <Typography variant="h4">Dashboard</Typography>
                <Typography variant="body1">Cloud-Connected<br />Smart Hand Sanitizer Dispenser Data</Typography>
            </Box>
            </Grid>
            <Grid item xs={12} md={3}>
                <Card variant='outlined' sx={{p:2, height:'100%'}}>
                    <Typography variant="body1" sx={{py:1}}>Usage Frequency</Typography>
                    <Typography variant="h4">{tempQuery.status == 'success' ? (tempQuery.data !== undefined && tempQuery.data !== null ? `${tempQuery.data.tempData.length}x` : 'No Data') : (tempQuery.status == 'loading' ? <CircularProgress size={20} />: 'Error')} </Typography>
                    <Typography variant="body1" sx={{py:1}}>{tempQuery.status == 'success' ? (tempQuery.data !== undefined && tempQuery.data !== null ? `Since ${DateTime.fromJSDate(tempQuery.data.tempData[tempQuery.data.tempData.length-1]?.timestamp).toFormat('dd LLL yyyy HH:mm')}`: 'No Data' ): (tempQuery.status == 'loading' ? '': tempQuery.error.message)}</Typography>
                </Card>
            </Grid>
            <Grid item xs={12} md={3}>
                <Card variant='outlined' sx={{p:2, height:'100%'}}>
                    <Typography variant="body1" sx={{py:1}}>Last Refill/Starting Data</Typography>
                    <Typography variant="h4">{lastRefillQuery.status == 'success' ? (lastRefillQuery.data !== undefined && lastRefillQuery.data !== null ? DateTime.fromJSDate(lastRefillQuery.data.timestamp).setLocale('en-US').toRelative(): 'No Data' ): (lastRefillQuery.status == 'loading' ? <CircularProgress size={20} />: 'Error')} </Typography>
                    <Typography variant="body1" sx={{py:1}}>{lastRefillQuery.status == 'success' ? (lastRefillQuery.data !== undefined && lastRefillQuery.data !== null ? DateTime.fromJSDate(lastRefillQuery.data.timestamp).toFormat('dd LLL yyyy HH:mm'): 'No Data' ): (lastRefillQuery.status == 'loading' ? '': lastRefillQuery.error.message)}</Typography>
                </Card>
            </Grid>
            <Grid item xs={12} md={3} >
                <Card variant='outlined' sx={{p:2}}>
                    <Box display='flex' alignItems='center' justifyContent='space-between'>
                        <Typography variant="body1">Next Refill Estimation</Typography>
                        <IconButton onClick={() => void forceRetrain()}><ModelTraining /></IconButton>
                    </Box>
                    <Typography variant="h4">{refillEstimateQuery.status == 'success' ? (refillEstimateQuery.data !== undefined && refillEstimateQuery.data !== null ? DateTime.fromJSDate(refillEstimateQuery.data.tOnValue).setLocale('en-US').toRelative(): 'No Data') : (refillEstimateQuery.status == 'loading' ? <CircularProgress size={20} />: 'Error')}</Typography>
                    <Typography variant="body1" sx={{py:1}}>{refillEstimateQuery.status == 'success' ? (refillEstimateQuery.data !== undefined && refillEstimateQuery.data !== null ? DateTime.fromJSDate(refillEstimateQuery.data.tOnValue).toFormat('dd LLL yyyy HH:mm'): 'No Data') : (refillEstimateQuery.status == 'loading' ? '': refillEstimateQuery.error.message)}</Typography>
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
                    // labels: liquidQuery.data?.bucketedData.map((el: { bucket: Date; }) => DateTime.fromJSDate(el.bucket).toJSDate()) ?? [],
                    datasets:[
                        {
                            type: 'line',
                            label: "Liquid Level",
                            data: liquidQuery.data?.bucketedData.map((el: { avgLevel: number | null; bucket: Date }) => ({
                                x: el.bucket,
                                y: el.avgLevel
                            })) ?? [],
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgb(255, 99, 132)',
                        },
                        ...(liquidQuery.data !== undefined && liquidQuery.data !== null &&
                                liquidQuery.data.bucketedData.length > 0 && refillEstimateQuery.data !== null &&
                                refillEstimateQuery.data !== undefined ? [
                            {
                                label: "Liquid Level (Prediction)",
                                data: [
                                    {
                                        x: liquidQuery.data.bucketedData[0]?.bucket,
                                        y: liquidQuery.data.bucketedData[0]?.avgLevel,
                                    },
                                    {
                                        x: refillEstimateQuery.data.tOnValue,
                                        y: refillEstimateQuery.data.value,
                                    }
                                ],
                                borderColor: 'rgba(169,169,169,0.5)',
                                backgroundColor: 'rgba(169,169,169,0.5)',
                                spanGaps: true
                            }
                        ] : [] )
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
    </>
  )
}
