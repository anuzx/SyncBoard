"use client"


export function AuthPage({ isSignin }: {
    isSignin:boolean
}) {
    return (
      <div className="w-screen h-screen flex justify-center items-center">
        <div className="p-2 m-2 bg-white rounded">
          <input type="text" placeholder="Email..."></input>
                <input type="text" placeholder="password..."></input>
                
                <button onClick={() => {
                    
                }}>{isSignin?"Signin" :"Signup" }</button>
        </div>
      </div>
    );
}