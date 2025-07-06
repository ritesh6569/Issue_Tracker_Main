import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

// static async findById(id) {
//     const connection = getConnection();
//     const [rows] = await connection.query(`SELECT * FROM users WHERE id = ?`, [id]);
//     return rows.length ? new User(rows[0]) : null;
// }


export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader) {
            throw new ApiError(401, "Authorization header is missing");
        }

        if (!authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Authorization header format is invalid");
        }

        const token = authHeader.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(401, "Token is missing");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // console.log("Decoded Token:", decodedToken);

        if (!decodedToken.id) {
            throw new ApiError(401, "Token does not contain user ID");
        }

        const user = await User.findById(decodedToken.id);

        if (!user) {
            throw new ApiError(401, "Invalid Access Token: User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("JWT verification failed:", error.message);
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

// Middleware to verify if the user is an admin
export const isAdmin = asyncHandler(async (req, _, next) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized - Please login first");
    }
    
    if (!req.user.is_admin) {
        throw new ApiError(403, "Forbidden - Admin access required");
    }
    
    next();
});
