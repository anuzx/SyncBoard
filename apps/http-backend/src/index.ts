import express from "express"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "./config";
import { userAuth } from "./middleware";
const app = express()



app.post("/signup", (req, res) => {
    //we should do zod validation here
})


app.post("/signin", (req, res) => {
  
    const userId = 1;
    const token =jwt.sign({
    userId
    }, JWT_SECRET)
    
    res.json({
        token
    })
});



app.post("/createRoom", userAuth ,(req, res) => {
  
});


app.listen(3001, () => console.log("server started at port 3000"))


