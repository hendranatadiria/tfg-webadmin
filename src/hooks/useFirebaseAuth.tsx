import { onAuthStateChanged, type User, type IdTokenResult, sendPasswordResetEmail, createUserWithEmailAndPassword as createUserEPass, signInWithEmailAndPassword as signInEPass, signOut as sOut } from 'firebase/auth'
import { useState, useEffect } from 'react'
import { auth } from 'src/config/firebase'

// interface UserType {
//   email: string
//   uid: string | number | null
// }

// const formatAuthUser = (user: Firebase.User) => {
//  user.
// }
interface FirebaseUserWithClaims extends User {
  authTokenData?: IdTokenResult
}

const useFirebaseAuth = () => {
  const [authUser, setAuthUser] = useState<null | FirebaseUserWithClaims>(null)
  const [loading, setLoading] = useState(true)
  // const firestore = getFirestore();
  // let callback = null;
  // let unsubscribe:null|Function = null;

  

  const authStateChanged = (authState: FirebaseUserWithClaims|null) => {
    // if (unsubscribe !== null) unsubscribe();
    if (!authState) {
      setAuthUser(null)
      setLoading(false)
    } else {
      setLoading(true)
      // const formattedUser = formatAuthUser(authState)
      const formattedUser = authState
      setAuthUser(formattedUser)
      setLoading(false)

    //   unsubscribe = firestore.doc(`usersData/${formattedUser.uid}`).onSnapshot((doc) => {
    //     if (doc.exists) {
    //       console.log("User data from update snapshot:", doc.data());
    //       authState.getIdToken(true);
    //       setLoading(true);
    //       localStorage.setItem('token', JSON.stringify(authState.authTokenData?.token))
    //       console.log('data authState: ',authState)
    //       authState.getIdTokenResult().then((claimsData) => {
    //           authState['authTokenData'] = claimsData;
    //         setAuthUser(authState);
    //         setLoading(false);
    //       });
          
    //     }
    // });
    }
  }

  const resetUser = () => {
    setAuthUser(null)
    setLoading(false)
    // toast.success("Berhasil logout. Sampai jumpa lagi!");
  }

  const signInWithEmailAndPassword = (email: string, password: string) =>
    signInEPass(auth, email, password)

  const createUserWithEmailAndPassword = (email: string, password: string) =>
    createUserEPass(auth, email, password)

  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email)

  // const updateUser = (profile: {
  //   displayName?: string | null;
  //   photoURL?: string | null;
  // }) => currentUser?.updateProfile(profile);

  const signOut = () => sOut(auth).then(resetUser)

  // listen for Firebase state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, authStateChanged)

    return () => unsubscribe()
  }, [])

  return {
    loading,
    signOut,
    authUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    resetPassword
  }
}

export default useFirebaseAuth
