import { Autocomplete, Box, Button, CircularProgress, Container, Grid, TextField, Typography, styled } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { DateTime } from "luxon";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DateRangePicker } from "rsuite";
import 'rsuite/dist/rsuite.min.css'; // or 'rsuite/dist/rsuite.min.css'
import { isNull } from "util";
import { api } from "~/utils/api";

type IProps = Record<string, never>

const LevelLogPage = (_props) => {
    const {query, push} = useRouter();
    const [startDate, setStartDate] = useState<Date|undefined>(DateTime.now().minus({days: 7}).startOf('day').toJSDate());
    const [endDate, setEndDate] = useState<Date|undefined>(DateTime.now().toJSDate());
    const [deviceId, setDeviceId] = useState<string>('');
    const liquidQuery = api.liquidLevel.getLiquidLevelLogs.useQuery({deviceId: deviceId!==''?deviceId:undefined, startDate, endDate}, {enabled: (deviceId !==undefined), refetchOnWindowFocus: false});
    const deviceQuery = api.device.getAllDevices.useQuery(undefined, {refetchOnWindowFocus: false});

    function refetchAll(): void {
        void liquidQuery.refetch();
    }

    useEffect(() => {
        if (deviceQuery.data) {
                setDeviceId((query?.deviceId as string) ?? deviceQuery.data[0]?.id ?? '');
            }   
    }, [deviceQuery.data, query]);

    useEffect(() => {
        const queryNew = {...query};
        if (deviceId == ''){
            delete queryNew.deviceId;
        } else {
            queryNew.deviceId = deviceId;
        }
        void push({ query: { ...queryNew} }, undefined, { shallow: true });
    }, [deviceId]);

    const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
        '& .t0-row': {
            backgroundColor: theme.palette.info.light,
            // color: theme.palette.primary.contrastText,
            '&:hover': {
                backgroundColor: theme.palette.info.dark,
            },
            '&.Mui-selected': {
                backgroundColor: theme.palette.info.main,
            },
            '&.Mui-selected:hover': {
                backgroundColor: theme.palette.info.dark,
            }
        },
    }));


    return (
        <Container maxWidth="xl" sx={{pt:5, mb: 10}}>
        <Box>
            <Typography variant="h4">Liquid Level Log Data</Typography>
            <Typography variant="body1">Cloud-Connected Smart Hand Sanitizer Dispenser Data</Typography>
        </Box>
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
                cleanable
                value={startDate && endDate ? [startDate, endDate] : undefined}
                placeholder="Select Data Period Range"
                onClean={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    console.log("Cleaned date!");
                    setTimeout(() => {
                        void liquidQuery.refetch();
                    }, 100);
                }}
                // defaultCalendarValue={[DateTime.now().minus({days: 7}).startOf('day').toJSDate(), DateTime.now().toJSDate()]}
                onChange={(value) => {
                    setStartDate(value!==null? value[0]:undefined);
                    setEndDate(value!==null? value[1]:undefined);
                    // set timer for 100ms to wait for the state to be updated
                    setTimeout(() => {
                        void liquidQuery.refetch();
                    }, 100);
                }}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <Button variant="contained" onClick={refetchAll} disabled={liquidQuery.status == 'loading'} fullWidth>Refresh &nbsp; {(liquidQuery.status == 'loading') && <CircularProgress size={18} />}</Button>
            </Grid>
        </Grid>
        <Grid container spacing={2} sx={{pt:5}}>
            <Grid item xs={12}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column'
            }}>
                <StyledDataGrid 
                    rows={liquidQuery.data !== undefined? liquidQuery.data.liquidLevelData.map(el => {
                        return {
                            id: el.id,
                            deviceId: el.deviceId,
                            timestamp: el.timestamp,
                            level: el.level,
                            height: el.height,
                            isT0: el.isT0,
                        }}) : []}
                    columns={[
                        { field: 'id', headerName: 'Record ID', flex: 0.4},
                        { field: 'deviceId', headerName: 'Device ID', flex: 0.4 },
                        { field: 'timestamp', headerName: 'Timestamp', flex: 0.4, type: 'dateTime', valueFormatter: (params) => DateTime.fromJSDate(params.value as Date).toFormat('dd/MM/yyyy HH:mm:ss') },
                        { field: 'level', headerName: 'Level', flex: 0.2, valueFormatter: (params) => String(params.value) + ' %' },
                        { field: 'height', headerName: 'Height', flex: 0.2, valueFormatter: (params) => String(params.value) + ' cm' },
                        { field: 'isT0', headerName: 'Refill/Init Data?', flex: 0.2, type: 'boolean', valueFormatter: (params) => params.value? 'Yes' : 'No' },
                    ]}
                    pageSizeOptions={[10, 20, 50, 100, 500]}
                    getRowClassName={(params) => params.row.isT0 ? 't0-row' : ''}
                    loading={liquidQuery.status == 'loading'}
                    autoHeight
                    sx={{width: '100%'}}                    
                    />
            </Grid>
        </Grid>
        </Container>
    );
}

export default LevelLogPage;