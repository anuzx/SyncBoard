"use client"
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google"


export const AuthPage = () => {

  const responseGoogle = async (authResult) => {
    try {

    } catch (err) {
      console.error("error while gooogle auth", err)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: 'auth-code'
  })
  return (
    <div>
      <button onClick={googleLogin}>
        Login with google</button>
    </div>
  )
}
