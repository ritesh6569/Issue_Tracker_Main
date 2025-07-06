import bcrypt from "bcrypt";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { getConnection } from "../db/index.js";
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const connection = await getConnection();
        
        // Query for the user
        const [users] = await connection.query("SELECT * FROM users WHERE id = ?", [userId]);

        // Check if user exists
        if (users.length === 0) {
            throw new ApiError(404, "User not found");
        }

        const user = users[0];

        // Generate the access token with a short expiration time (15 minutes)
        const accessToken = jwt.sign(
            { 
                id: user.id, 
                is_admin: user.is_admin 
            }, 
            process.env.ACCESS_TOKEN_SECRET, 
            { expiresIn: "1d" }
        );

        // Generate the refresh token with a longer expiration time (7 days)
        const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Error generating access and refresh tokens:", error.message); // Log the error
        throw new ApiError(500, "Error generating access and refresh tokens");
    }
};


// Login a user
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        throw new ApiError(400, "Username and password are required");
    }

    const connection = await getConnection();

    // Fetch the user from the database
    const [rows] = await connection.query("SELECT * FROM users WHERE id = ?", [username]);

    // Check if the user exists
    if (rows.length === 0) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Extract the user object
    const user = rows[0];

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

    // Prepare user response
    const loggedInUser = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        department: user.department_id,
        is_admin: user.is_admin || false
    };

    // Set cookies and send response
    res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "None" });
    
    // Return different message based on user type
    const successMessage = user.is_admin ? "Admin logged in successfully" : "User logged in successfully";
    
    res.status(200).json(
        new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, successMessage)
    );
});


// Logout a user
const logoutUser = asyncHandler(async (req, res) => {
    const connection = await getConnection();
    // await connection.query("UPDATE users SET refresh_token = NULL WHERE id = ?", [req.user.id]);

    res.clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: "None" });
    res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "None" });
    res.status(200).json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const connection = await getConnection();
        const [user] = await connection.query("SELECT * FROM users WHERE id = ?", [decoded.id]);

        if (!user || user.refresh_token !== incomingRefreshToken) throw new ApiError(401, "Invalid or expired refresh token");

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user.id);

        res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "None" });
        res.cookie("refreshToken", newRefreshToken, { httpOnly: true, secure: true, sameSite: "None" });
        res.status(200).json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully"));
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }
});

// Change user's current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "New password must be at least 6 characters long");
    }

    const connection = await getConnection();
    const [users] = await connection.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    
    if (users.length === 0) {
        throw new ApiError(404, "User not found");
    }
    
    const user = users[0];

    // Compare provided old password with stored hashed password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Current password is incorrect");
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update with the hashed new password
    await connection.query("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, req.user.id]);
    
    res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Get current user's details
const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
});

// Update account details
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) throw new ApiError(400, "All fields are required");

    const connection = await getConnection();
    await connection.query("UPDATE users SET fullName = ?, email = ? WHERE id = ?", [fullName, email, req.user.id]);

    const [updatedUser] = await connection.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.status(200).json(new ApiResponse(200, updatedUser, "Account details updated successfully"));
});

// Get department-specific issues
const getDepartmentIssues = asyncHandler(async (req, res) => {
    const connection = await getConnection();
    const [issues] = await connection.query("SELECT * FROM issues WHERE require_department = ?", [req.user.department]);

    res.status(200).json(new ApiResponse(200, issues, "Issues fetched successfully"));
});

// Admin: Create a new user (admin can create both regular and admin users)
const adminCreateUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, department, phoneNumber, isAdmin } = req.body;

    // Validate required fields
    if ([fullName, email, username, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Please provide a valid email address");
    }

    // Validate phone number format (optional field)
    if (phoneNumber && !/^\d{10,15}$/.test(phoneNumber.replace(/[^\d]/g, ''))) {
        throw new ApiError(400, "Please provide a valid phone number");
    }

    const connection = await getConnection();

    // Check if user already exists with same username or email
    const [existingUser] = await connection.query(
        "SELECT * FROM users WHERE id = ? OR email = ?",
        [username, email]
    );

    if (existingUser.length > 0) {
        // Check which field caused the conflict
        if (existingUser[0].id === username) {
            throw new ApiError(409, "Username already exists");
        } else if (existingUser[0].email === email) {
            throw new ApiError(409, "Email already exists");
        } else {
            throw new ApiError(409, "User with email or username already exists");
        }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set is_admin field based on the request
    const is_admin = isAdmin ? 1 : 0;

    let departmentId = department;
    
    // Only check for department if user is not an admin or if department is specified for an admin
    // console.log(department);
    

    // Insert the new user
    await connection.query(
        "INSERT INTO users (full_name, email, id, password, department_id, phone_number, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [fullName, email, username.toLowerCase(), hashedPassword, departmentId, phoneNumber, is_admin]
    );

    res.status(201).json(
        new ApiResponse(201, { 
            username, 
            email, 
            isAdmin: !!is_admin,
            department: department || null 
        }, 
        is_admin ? "Admin user created successfully" : "User created successfully")
    );
});

// Admin: Get all users
const adminGetAllUsers = asyncHandler(async (req, res) => {
    const connection = await getConnection();
    
    // Get all users with their department information
    const [users] = await connection.query(`
        SELECT u.id, u.full_name, u.email, u.phone_number, 
               u.is_admin, u.created_at, d.name AS department_name 
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.department_id
        ORDER BY u.created_at DESC
    `);

    res.status(200).json(
        new ApiResponse(200, { users }, "Users fetched successfully")
    );
});

// Admin: Update user
const adminUpdateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { fullName, email, phoneNumber, department, isAdmin } = req.body;

    const connection = await getConnection();

    // Check if user exists
    const [userExists] = await connection.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
        throw new ApiError(404, "User not found");
    }

    // Check if we're changing user to/from admin
    const currentIsAdmin = userExists[0].is_admin;
    const changingToAdmin = isAdmin !== undefined && isAdmin && !currentIsAdmin;
    const changingFromAdmin = isAdmin !== undefined && !isAdmin && currentIsAdmin;
    
    let departmentId = userExists[0].department_id;
    
    // Handle department changes
    if (department) {
        const [deptResult] = await connection.query(
            "SELECT department_id FROM departments WHERE name = ?", 
            [department]
        );
        
        if (deptResult.length === 0) {
            throw new ApiError(404, "Department not found");
        }
        
        departmentId = deptResult[0].department_id;
    } else if (changingToAdmin) {
        // If changing to admin and no department specified, set department to NULL
        departmentId = null;
    } else if (changingFromAdmin && !department) {
        // If changing from admin to regular user, require a department
        throw new ApiError(400, "Department is required when changing from admin to regular user");
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (fullName) {
        updateFields.push("full_name = ?");
        updateValues.push(fullName);
    }

    if (email) {
        updateFields.push("email = ?");
        updateValues.push(email);
    }

    if (phoneNumber) {
        updateFields.push("phone_number = ?");
        updateValues.push(phoneNumber);
    }

    // Always update department_id if we're changing admin status
    if (department || changingToAdmin || changingFromAdmin) {
        updateFields.push("department_id = ?");
        updateValues.push(departmentId);
    }

    if (isAdmin !== undefined) {
        updateFields.push("is_admin = ?");
        updateValues.push(isAdmin ? 1 : 0);
    }

    if (updateFields.length === 0) {
        throw new ApiError(400, "No fields provided for update");
    }

    // Add user ID to values
    updateValues.push(userId);

    // Execute update
    await connection.query(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
    );

    res.status(200).json(
        new ApiResponse(200, { userId }, "User updated successfully")
    );
});

// Admin: Delete user
const adminDeleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    // Check if admin is trying to delete themselves
    if (req.user.id === userId) {
        throw new ApiError(403, "Administrators cannot delete their own accounts");
    }
    
    const connection = await getConnection();
    
    // Check if user exists
    const [userExists] = await connection.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
        throw new ApiError(404, "User not found");
    }
    
    // Delete the user
    await connection.query("DELETE FROM users WHERE id = ?", [userId]);
    
    res.status(200).json(
        new ApiResponse(200, { userId }, "User deleted successfully")
    );
});

// Admin: Reset user password
const adminResetPassword = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { newPassword } = req.body;

    // Validate input
    if (!userId || !newPassword) {
        throw new ApiError(400, "User ID and new password are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const connection = await getConnection();
    
    // Check if user exists
    const [userExists] = await connection.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
        throw new ApiError(404, "User not found");
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    await connection.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);
    
    res.status(200).json(
        new ApiResponse(200, { userId }, "User password reset successfully")
    );
});

export {
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    getDepartmentIssues,
    adminCreateUser,
    adminGetAllUsers,
    adminUpdateUser,
    adminDeleteUser,
    adminResetPassword,
};
