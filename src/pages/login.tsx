import { Box, Button, CircularProgress, Container, TextField, Typography } from "@mui/material";
import { useFormik } from "formik";
import React, {useEffect} from "react";
import useFirebaseAuth from "~/hooks/useFirebaseAuth";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/router";
import FullPageLoading from "~/Components/FullPageLoading";

const LoginPage = () => {

    const formik = useFormik({
        initialValues: {
            email: '',
            password: ''
        },
        onSubmit: async (values) => {
            try{
                await authFirebase.signInWithEmailAndPassword(values.email,values.password)
            } catch (error) {
                console.log(error);
                if (error instanceof FirebaseError) {
                    if (error.code === "auth/invalid-email" || error.code === "auth/invalid-password" || error.code === "auth/user-not-found") {
                        formik.setFieldError('email', "Provided username or password is incorrect. Please check your details and try again.");
                    } else {
                        formik.setFieldError('email', error.message)
                    }
                }
            }
        }
    })
    const authFirebase = useFirebaseAuth();
    const route = useRouter();

    useEffect(() => {
        if(authFirebase.authUser !== null && !authFirebase.loading) {
            if (route.query.next !== undefined) {
                void route.push({
                    pathname: route.query.next as string
                })
            } else {
                void route.push({
                    pathname: '/'
                })
            }
        }

    }, [authFirebase, route])


    return (
        <Container>
            { authFirebase.authUser == null && !authFirebase.loading ?
                <Box sx={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 72px)', py: 5}} gap={1}>
                <Typography variant='h4'>Log In</Typography>
                <Typography variant='body1' align="center" fontStyle={'italic'} sx={{pb:3, color: (theme) => theme.palette.text.secondary}}>Cloud-Connected Smart Hand Sanitizer Dispenser</Typography>
                <form onSubmit={formik.handleSubmit} style={{width: '100%', maxWidth:400}}>
                    <Box display='flex' flexDirection='column' gap={1}  width={'100%'}>
                        <TextField value={formik.values.email} autoComplete="off" onChange={formik.handleChange} onBlur={formik.handleBlur} name="email" fullWidth label="Email" variant="outlined"  error={Boolean(formik.errors.email)} helperText={Boolean(formik.errors.email) && formik.errors.email}></TextField>
                        <TextField value={formik.values.password} autoComplete="off" onChange={formik.handleChange} onBlur={formik.handleBlur} name="password" fullWidth label="Password" variant="outlined" type="password" error={Boolean(formik.errors.password)} helperText={Boolean(formik.errors.password) && formik.errors.password}></TextField>
                        <Button variant="contained" fullWidth type="submit"
                        disabled={formik.isSubmitting}
                        sx={{mt:2}}
                        onClick={() => {formik.handleSubmit()}}>Log In &nbsp;{formik.isSubmitting && <CircularProgress size={20} />}</Button>
                    </Box>
                </form>
            </Box> : <FullPageLoading/> }
        </Container>
    );
}

export default LoginPage;