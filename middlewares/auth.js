import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
dotenv.config();

const auth = async(request,response,next)=>{
    try {
        const token =  request?.headers?.authorization?.split(" ")[1];

        if(!token){
            return response.status(401).json({
                message : "Please provide the access token in Authorization header",
                error : true,
                success : false
            })
        }

        const decode =  jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN);

        if(!decode){
            return response.status(401).json({
                message : "Unauthorized access",
                error : true,
                success : false
            })
        }

        request.userId = decode.id

        next();

    } catch (error) {
        return response.status(401).json({
            message : "Invalid or expired token",
            error : true,
            success : false
        })
    }
}

export default auth