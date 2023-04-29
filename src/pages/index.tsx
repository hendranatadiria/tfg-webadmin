import styles from "./index.module.css";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Home: NextPage = (props) => {
const {replace} = useRouter();

  useEffect(() => {
    void replace('/dashboard');
  }, []);


  return (
    <>
      
    </>
  );
};

export default Home;
