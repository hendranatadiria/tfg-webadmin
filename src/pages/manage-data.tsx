import { Download } from "@mui/icons-material";
import { Alert, Box, CircularProgress, Container, IconButton, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { ref, listAll, ListResult, StorageReference, getBlob, getMetadata, FullMetadata } from "firebase/storage";
import Head from "next/head";
import { useEffect, useState } from "react";
import AuthGuard from "~/Components/AuthGuard";
import FullPageLoading from "~/Components/FullPageLoading";
import { useStorage } from "~/config/firebase";

const ManageDataPage = () => {

    const storage = useStorage();

    const listRef = ref(storage, 'log-backups/');

    const [isFetching, setFetching] = useState(true);
    const [error, setError] = useState<string|undefined>();
    const [listData, setList] = useState<ListResult|undefined>();

    const listAllData = async () => { 
        try {
            setFetching(true);
            setError(undefined);
            const list = await listAll(listRef);
            setList(list);
            setFetching(false);
        } catch (e) {
            console.log(e)
            setError("Error fetching backup files from Storage");
            setFetching(false)
        }
    }

    useEffect(() => {
        void listAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const downloadFile = async (fullPath:string, filename: string) => {
        try {
            setError(undefined);
            const fileRef = ref(storage, fullPath);
            const data = await getBlob(fileRef);

            const downloadUrl = window.URL.createObjectURL(data);
            const tempLink = document.createElement('a');
            tempLink.href=downloadUrl;
            tempLink.setAttribute('download', filename);
            tempLink.click();

        } catch (e) {
            console.error(e);
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            setError(`Error occured when downloading file: ${(e as any)?.message??''}`)
        }
    }
        
    const columnDef: GridColDef<StorageReference>[] = [
        {
            field: 'name', headerName: 'File Name',
            minWidth: 500, flex: 0.6,
        },
        {
            field: 'action', headerName: 'Action',
            sortable: false,
            filterable: false,
            hideable: false,
            type: 'action',
            minWidth: 50, flex: 0.1,
            renderCell: (params) => (
                <>
                    <IconButton onClick={() => void downloadFile(params.row.fullPath, params.row.name)}><Download /></IconButton>
                </>
            )
        }
    ]

    return (
        <AuthGuard>
            <div>
                <Head>
                    <title>Manage Log Backup Data | Cloud-Connected Smart Hand Sanitizer Dispenser Web Admin</title>
                </Head>
                <>
                    <Container maxWidth="xl" sx={{pt:5, mb: 10}}>
                        
                    <Box sx={{mb:5}}>
                        <Typography variant="h4">Manage Log Backup Data</Typography>
                        <Typography variant="body1">See and Download Backup Data</Typography>
                    </Box>

                    {Boolean(error) && <Alert color="error" sx={{mb:5}}>{error}</Alert> }

                    <DataGrid loading={isFetching} rows={listData?.items??[]} columns={columnDef} getRowId={(row) => row.fullPath} autoHeight/>
                        {/* {listData?.items.map((item) => {
                            return <Typography key={item.fullPath} variant="body2">{item}</Typography>
                        })} */}
                    </Container>
                </>
            </div>
        </AuthGuard>
    );
}

export default ManageDataPage;