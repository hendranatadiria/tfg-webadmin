import { Box, CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import { ReactNode, useEffect } from "react";
import useFirebaseAuth from "~/hooks/useFirebaseAuth";
import FullPageLoading from "./FullPageLoading";

const AuthGuard = ({children}: {children: ReactNode}) => {
    const firebaseAuth = useFirebaseAuth();
    const route = useRouter();
    

    useEffect(() => {
        if (firebaseAuth.authUser == null && !firebaseAuth.loading) {
            const nextUrl = route.asPath;
            void route.replace(`/login?next=${nextUrl}`);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firebaseAuth.authUser, firebaseAuth.loading])

    return (
        <>
            {firebaseAuth.loading || firebaseAuth.authUser == null ? <>
                <FullPageLoading />
            </> : children}
        </>
    );
}

export default AuthGuard;