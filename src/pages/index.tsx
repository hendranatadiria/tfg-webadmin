import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Home: NextPage = () => {
const {replace} = useRouter();

  useEffect(() => {
    void replace('/dashboard');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <>
      
    </>
  );
};

export default Home;
