import jwt from 'jsonwebtoken'

const auth = async(request,response,next)=>{
    try {
        const token =  request?.headers?.authorization?.split(" ")[1];

        if(!token){
           token = request.query.token; 
        }

        if(!token){
            return response.status(401).json({
                message : "Please provide the access token"
            })
        }

        const decode = await jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN);

        if(!decode){
            return response.status(401).json({
                message : "unauthorized access",
                error : true,
                success : false
            })
        }

        request.userId = decode.id

        next();

    } catch (error) {
        console.log("error : ",error);
        return response.status(500).json({
            message : "Invaliad Token",
            error : true,
            success : false,
            errorMessage : error.message
        })
    }
}

export default auth