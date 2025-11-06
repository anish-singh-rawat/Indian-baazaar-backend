import UserModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

const genertedRefreshToken = async (userId) => {
  const token = jwt.sign({ id: userId }, process.env.SECRET_KEY_REFRESH_TOKEN, {
    expiresIn: "7d",
  });
  await UserModel.updateOne({ _id: userId }, { refresh_token: token });

  return token;
};

export default genertedRefreshToken;
