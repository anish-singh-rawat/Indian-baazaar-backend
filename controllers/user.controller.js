import UserModel from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmailFun from "../config/sendEmail.js";
import VerificationEmail from "../utils/verifyEmailTemplate.js";
import generatedAccessToken from "../utils/generatedAccessToken.js";
import genertedRefreshToken from "../utils/generatedRefreshToken.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import ReviewModel from "../models/reviews.model.js.js";
import dotenv from "dotenv";
import AddressModel from "../models/address.model.js";
import { delCache } from "../utils/redisUtil.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function registerRetailerController(request, response) {
  try {
    const {
      name,
      email,
      password,
      mobile,
      address_line1,
      city,
      state,
      pincode,
      country,
      landmark,
      addressType, // "Home" | "Office"
    } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({
        message: "Provide name, email, and password",
        error: true,
        success: false,
      });
    }

    if (!mobile) {
      return response.status(400).json({
        message: "Provide mobile number",
        error: true,
        success: false,
      });
    }

    if (!address_line1 || !city || !state || !pincode || !country) {
      return response.status(400).json({
        message: "Provide complete address details",
        error: true,
        success: false,
      });
    }

    let user = await UserModel.findOne({ email });

    // Helper: create or update primary retailer address
    const createOrUpdateRetailerAddress = async (userDoc) => {
      const userIdString = userDoc._id.toString();

      // Mark all old addresses as not selected
      await AddressModel.updateMany(
        { userId: userIdString },
        { $set: { selected: false } }
      );

      const addressPayload = {
        address_line1,
        city,
        state,
        pincode,
        country,
        mobile,
        landmark: landmark || "",
        addressType: addressType || "Office", // default office/shop
        userId: userIdString,
        selected: true,
        status: true,
      };

      const addressDoc = await AddressModel.create(addressPayload);

      if (!userDoc.address_details) {
        userDoc.address_details = [];
      }

      const alreadyLinked = userDoc.address_details.some(
        (id) => id.toString() === addressDoc._id.toString()
      );

      if (!alreadyLinked) {
        userDoc.address_details.push(addressDoc._id);
      }

      await userDoc.save();

      return addressDoc;
    };

    if (user) {
      if (user.verify_email !== true) {
        const saltExisting = await bcryptjs.genSalt(10);
        const hashPasswordExisting = await bcryptjs.hash(password, saltExisting);

        const verifyCodeExisting = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        user.name = name;
        user.password = hashPasswordExisting;
        user.role = "RETAILER";
        user.mobile = mobile;
        user.otp = verifyCodeExisting;
        user.otpExpires = Date.now() + 600000; // 10 mins

        await user.save();

        // Create/update retailer address
        await createOrUpdateRetailerAddress(user);

        await sendEmailFun({
          sendTo: email,
          subject: "Verify email to register in the Indian Baazaar",
          text: "Verify email to register in the Indian Baazaar",
          html: VerificationEmail(name, verifyCodeExisting),
        });

        return response.status(200).json({
          success: true,
          error: false,
          message:
            "Verification email resent. Please check your inbox to verify your account.",
        });
      }

      // Already verified user with this email
      return response.status(400).json({
        message: "User already registered with this email",
        error: true,
        success: false,
      });
    }

    // New retailer registration
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    user = new UserModel({
      name,
      email,
      password: hashPassword,
      mobile,
      role: "RETAILER",
      otp: verifyCode,
      otpExpires: Date.now() + 600000, // 10 mins
    });

    await user.save();

    await createOrUpdateRetailerAddress(user);

    await sendEmailFun({
      sendTo: email,
      subject: "Verify email to register in the Indian Baazaar",
      text: "Verify email to register in the Indian Baazaar",
      html: VerificationEmail(name, verifyCode),
    });

    // Invalidate user cache after registration
    await delCache('users:all*');
    await delCache('users:details*');
    await delCache('users:search*');

    return response.status(200).json({
      success: true,
      error: false,
      message:
        "Verification email sent. Please check your inbox to verify your account.",
    });
  } catch (error) {
    console.error("registerRetailerController error:", error);
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function registerUserController(request, response) {
  try {
    let user;

    const { name, email, password } = request.body;
    if (!name || !email || !password) {
      return response.status(400).json({
        message: "provide email, name, password",
        error: true,
        success: false,
      });
    }

    user = await UserModel.findOne({ email: email });

    if (user) {
      if (user.verify_email !== true) {
        const saltExisting = await bcryptjs.genSalt(10);
        const hashPasswordExisting = await bcryptjs.hash(
          password,
          saltExisting
        );

        const verifyCodeExisting = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        user.name = name;
        user.password = hashPasswordExisting;
        user.otp = verifyCodeExisting;
        user.otpExpires = Date.now() + 600000;

        await user.save();

        await sendEmailFun({
          sendTo: email,
          subject: "Verify email to register in the Indian Baazaar",
          text: "Verify email to register in the Indian Baazaar",
          html: VerificationEmail(name, verifyCodeExisting),
        });

        return response.status(200).json({
          success: true,
          error: false,
          message:
            "Verification email resent. Please check your inbox to verify your account.",
        });
      }

      return response.json({
        message: "User already Registered with this email",
        error: true,
        success: false,
      });
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    user = new UserModel({
      email: email,
      password: hashPassword,
      name: name,
      otp: verifyCode,
      otpExpires: Date.now() + 600000,
    });

    await user.save();

    await sendEmailFun({
      sendTo: email,
      subject: "Verify email to register in the Indian Baazaar",
      text: "Verify email to register in the Indian Baazaar",
      html: VerificationEmail(name, verifyCode),
    });

    // Invalidate user cache after registration
    await delCache('users:all*');
    await delCache('users:details*');
    await delCache('users:search*');

    return response.status(200).json({
      success: true,
      error: false,
      message:
        "Verification email sent. Please check your inbox to verify your account.",
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function verifyEmailController(request, response) {
  try {
    const { email, otp } = request.body;

    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return response
        .status(400)
        .json({ error: true, success: false, message: "User not found" });
    }

    const isCodeValid = user.otp === otp;
    const isNotExpired = user.otpExpires > Date.now();

    if (isCodeValid && isNotExpired) {
      user.verify_email = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      const accesstoken = await generatedAccessToken(user._id);
      const refreshToken = await genertedRefreshToken(user._id);

      await UserModel.findByIdAndUpdate(user?._id, {
        last_login_date: new Date(),
      });

      const cookiesOption = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      };
      response.cookie("accessToken", accesstoken, cookiesOption);
      response.cookie("refreshToken", refreshToken, cookiesOption);

      return response.status(200).json({
        error: false,
        success: true,
        message: "Email verified successfully",
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          },
          accesstoken,
          refreshToken,
        },
      });
    } else if (!isCodeValid) {
      return response
        .status(400)
        .json({ error: true, success: false, message: "Invalid OTP" });
    } else {
      return response
        .status(400)
        .json({ error: true, success: false, message: "OTP expired" });
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function authWithGoogle(request, response) {
  const { name, email, avatar, mobile, role } = request.body;

  try {
    const existingUser = await UserModel.findOne({ email: email });

    if (!existingUser) {
      const user = await UserModel.create({
        name: name,
        mobile: mobile,
        email: email,
        password: null,
        avatar: avatar,
        role: role,
        verify_email: true,
        signUpWithGoogle: true,
      });

      await user.save();

      const accesstoken = await generatedAccessToken(user._id);
      const refreshToken = await genertedRefreshToken(user._id);

      await UserModel.findByIdAndUpdate(user?._id, {
        last_login_date: new Date(),
      });

      const cookiesOption = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      };
      response.cookie("accessToken", accesstoken, cookiesOption);
      response.cookie("refreshToken", refreshToken, cookiesOption);

      return response.json({
        message: "Login successfully",
        error: false,
        success: true,
        data: {
          accesstoken,
          refreshToken,
        },
      });
    } else {
      const accesstoken = await generatedAccessToken(existingUser._id);
      const refreshToken = await genertedRefreshToken(existingUser._id);

      await UserModel.findByIdAndUpdate(existingUser?._id, {
        last_login_date: new Date(),
      });

      const cookiesOption = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      };
      response.cookie("accessToken", accesstoken, cookiesOption);
      response.cookie("refreshToken", refreshToken, cookiesOption);

      return response.json({
        message: "Login successfully",
        error: false,
        success: true,
        data: {
          accesstoken,
          refreshToken,
        },
      });
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function loginAdminController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Admin ID not found",
        success: false,
      });
    }

    if (user.role !== "RETAILER" &&  user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied",
        success: false,
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        message: "Your account is not active, contact support",
        success: false,
      });
    }

    if (!user.verify_email) {
      return res.status(400).json({
        message: "Email not verified, please verify first",
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);
    if (!checkPassword) {
      return res.status(401).json({
        message: "Invalid password",
        success: false,
      });
    }

    const accessToken = await generatedAccessToken(user._id);
    const refreshToken = await genertedRefreshToken(user._id);

    await UserModel.findByIdAndUpdate(user._id, {
      last_login_date: new Date(),
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(200).json({
      message:`${user.role} login successfully`,
      success: true,
      data: {
        accessToken,
        refreshToken,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Admin Login Error:", err);
    return res.status(500).json({
      message: err.message || "Internal Server Error",
      success: false,
    });
  }
}

export async function loginUserController(request, response) {
  try {
    const { email, password } = request.body;

    const user = await UserModel.findOne({ email: email });

    if (!user) {
      return response.status(400).json({
        message: "User not register",
        error: true,
        success: false,
      });
    }

    if (user.status !== "Active") {
      return response.status(400).json({
        message: "Contact to admin",
        error: true,
        success: false,
      });
    }

    if (user.verify_email !== true) {
      return response.status(400).json({
        message: "Your Email is not verify yet please verify your email first",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);

    if (!checkPassword) {
      return response.status(400).json({
        message: "Check your password",
        error: true,
        success: false,
      });
    }

    const accesstoken = await generatedAccessToken(user._id);
    const refreshToken = await genertedRefreshToken(user._id);

    const updateUser = await UserModel.findByIdAndUpdate(user?._id, {
      last_login_date: new Date(),
    });

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };
    response.cookie("accessToken", accesstoken, cookiesOption);
    response.cookie("refreshToken", refreshToken, cookiesOption);

    return response.json({
      message: "Login successfully",
      error: false,
      success: true,
      data: {
        accesstoken,
        refreshToken,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function logoutController(request, response) {
  try {
    const userid = request.userId;
    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    response.clearCookie("accessToken", cookiesOption);
    response.clearCookie("refreshToken", cookiesOption);

    await UserModel.findByIdAndUpdate(userid, {
      refresh_token: "",
    });

    return response.json({
      message: "Logout successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

var imagesArr = [];
export async function userAvatarController(request, response) {
  try {
    imagesArr = [];

    const userId = request.userId;
    const image = request.files;

    const user = await UserModel.findOne({ _id: userId });

    if (!user) {
      return response.status(500).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    //first remove image from cloudinary
    const imgUrl = user.avatar;

    const urlArr = imgUrl.split("/");
    const avatar_image = urlArr[urlArr.length - 1];

    const imageName = avatar_image.split(".")[0];

    if (imageName) {
      await cloudinary.uploader.destroy(imageName, (error, result) => {
        console.log("Cloudinary Upload Error: ", error);
        if (error) {
          return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
          });
        }
        console.log("result: ", result);
      });
    }

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    for (let i = 0; i < image?.length; i++) {
      await cloudinary.uploader.upload(
        image[i].path,
        options,
        function (error, result) {
          console.log("error : ", error);
          if (error) {
            console.log("Cloudinary Upload Error: ", error);
            return response.status(500).json({
              message: error.message || error,
              error: true,
              success: false,
            });
          }
          imagesArr.push(result.secure_url);
          fs.unlinkSync(`uploads/${request.files[i].filename}`);
        }
      );
    }

    user.avatar = imagesArr[0];
    await user.save();

    return response.status(200).json({
      _id: userId,
      avtar: imagesArr[0],
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function removeImageFromCloudinary(request, response) {
  try {
    const imgUrl = request.query.img;

    const urlArr = imgUrl.split("/");
    const image = urlArr[urlArr.length - 1];

    const imageName = image.split(".")[0];

    if (imageName) {
      const res = await cloudinary.uploader.destroy(
        imageName,
        (error, result) => {
          console.log("Cloudinary Upload Error: ", error);
          if (error) {
            return response.status(500).json({
              message: error.message || error,
              error: true,
              success: false,
            });
          }
          console.log("result: ", result);
        }
      );

      if (res) {
        response.status(200).send(res);
      }
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//update user details
export async function updateUserDetails(request, response) {
  try {
    const userId = request.userId; //auth middleware
    const { name, email, mobile, password } = request.body;

    const userExist = await UserModel.findById(userId);
    if (!userExist)
      return response.status(400).send("The user cannot be Updated!");

    const updateUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        name: name,
        mobile: mobile,
        email: email,
      },
      { new: true }
    );

    // Invalidate user cache after update
    await delCache('users:all*');
    await delCache('users:details*');
    await delCache('users:search*');

    return response.json({
      message: "User Updated successfully",
      error: false,
      success: true,
      user: {
        name: updateUser?.name,
        _id: updateUser?._id,
        email: updateUser?.email,
        mobile: updateUser?.mobile,
        avatar: updateUser?.avatar,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//forgot password
export async function forgotPasswordController(request, response) {
  try {
    const { email } = request.body;

    const user = await UserModel.findOne({ email: email });

    if (!user) {
      return response.status(400).json({
        message: "Email not available",
        error: true,
        success: false,
      });
    } else {
      let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

      user.otp = verifyCode;
      user.otpExpires = Date.now() + 600000;

      await user.save();

      await sendEmailFun({
        sendTo: email,
        subject: "Verify OTP from Ecommerce App",
        text: "",
        html: VerificationEmail(user.name, verifyCode),
      });

      return response.json({
        message: "OTP sent, check your email",
        error: false,
        success: true,
      });
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function verifyForgotPasswordOtp(request, response) {
  try {
    const { email, otp } = request.body;

    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return response.status(400).json({
        message: "Email not available",
        error: true,
        success: false,
      });
    }

    if (!email || !otp) {
      return response.status(400).json({
        message: "Provide required field email, otp.",
        error: true,
        success: false,
      });
    }

    if (otp !== user.otp) {
      return response.status(400).json({
        message: "Invailid OTP",
        error: true,
        success: false,
      });
    }

    // otpExpires is stored as a Date; compare numeric timestamp values
    const currentTime = Date.now();

    if (user.otpExpires < currentTime) {
      return response.status(400).json({
        message: "Otp is expired",
        error: true,
        success: false,
      });
    }

    user.otp = "";
    user.otpExpires = "";

    await user.save();

    return response.status(200).json({
      message: "Verify OTP successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//reset password
export async function resetpassword(request, response) {
  try {
    const { email, oldPassword, newPassword, confirmPassword } = request.body;
    if (!email || !newPassword || !confirmPassword) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "provide required fields email, newPassword, confirmPassword",
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return response.status(400).json({
        message: "Email is not available",
        error: true,
        success: false,
      });
    }

    if (user?.signUpWithGoogle === false) {
      const checkPassword = await bcryptjs.compare(oldPassword, user.password);
      if (!checkPassword) {
        return response.status(400).json({
          message: "your old password is wrong",
          error: true,
          success: false,
        });
      }
    }

    if (newPassword !== confirmPassword) {
      return response.status(400).json({
        message: "newPassword and confirmPassword must be same.",
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(confirmPassword, salt);

    user.password = hashPassword;
    user.signUpWithGoogle = false;
    await user.save();

    return response.json({
      message: "Password updated successfully.",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//change password
export async function changePasswordController(request, response) {
  try {
    const { email, newPassword, confirmPassword } = request.body;
    if (!email || !newPassword || !confirmPassword) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "provide required fields email, newPassword, confirmPassword",
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return response.status(400).json({
        message: "Email is not available",
        error: true,
        success: false,
      });
    }

    if (newPassword !== confirmPassword) {
      return response.status(400).json({
        message: "newPassword and confirmPassword must be same.",
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(confirmPassword, salt);

    user.password = hashPassword;
    user.signUpWithGoogle = false;
    await user.save();

    return response.json({
      message: "Password updated successfully.",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//refresh token controler
export async function refreshToken(request, response) {
  try {
    const refreshToken =
      request.cookies.refreshToken ||
      request?.headers?.authorization?.split(" ")[1]; /// [ Bearer token]

    if (!refreshToken) {
      return response.status(401).json({
        message: "Invalid token",
        error: true,
        success: false,
      });
    }

    const verifyToken = await jwt.verify(
      refreshToken,
      process.env.SECRET_KEY_REFRESH_TOKEN
    );
    if (!verifyToken) {
      return response.status(401).json({
        message: "token is expired",
        error: true,
        success: false,
      });
    }

    const userId = verifyToken?._id;
    const newAccessToken = await generatedAccessToken(userId);

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    response.cookie("accessToken", newAccessToken, cookiesOption);

    return response.json({
      message: "New Access token generated",
      error: false,
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get login user details
export async function userDetails(request, response) {
  try {
    const userId = request.userId;

    const user = await UserModel.findById(userId)
      .select("-password -refresh_token")
      .populate("address_details");

    return response.json({
      message: "user details",
      data: user,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Something is wrong",
      error: true,
      success: false,
    });
  }
}

//review controller
export async function addReview(request, response) {
  try {
    const { image, userName, review, rating, userId, productId } = request.body;

    const userReview = new ReviewModel({
      image: image,
      userName: userName,
      review: review,
      rating: rating,
      userId: userId,
      productId: productId,
    });

    await userReview.save();

    return response.json({
      message: "Review added successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Something is wrong",
      error: true,
      success: false,
    });
  }
}

//get reviews
export async function getReviews(request, response) {
  try {
    const productId = request.query.productId;

    const reviews = await ReviewModel.find({ productId: productId });

    if (!reviews) {
      return response.status(400).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      reviews: reviews,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Something is wrong",
      error: true,
      success: false,
    });
  }
}

//get all reviews
export async function getAllReviews(request, response) {
  try {
    const reviews = await ReviewModel.find();

    if (!reviews) {
      return response.status(400).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      reviews: reviews,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Something is wrong",
      error: true,
      success: false,
    });
  }
}

//get all users
export async function getAllUsers(request, response) {
  try {
    const { page, limit } = request.query;

    const totalUsers = await UserModel.find();

    const users = await UserModel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await UserModel.countDocuments(users);

    if (!users) {
      return response.status(400).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      users: users,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalUsersCount: totalUsers?.length,
      totalUsers: totalUsers,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Something is wrong",
      error: true,
      success: false,
    });
  }
}
