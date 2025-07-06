// Create initial admin script
import bcrypt from "bcrypt";
import connectDB, { getConnection } from "../db/index.js";
import dotenv from "dotenv";

dotenv.config();

const createInitialAdmin = async () => {
    try {
        // Initialize the database connection first
        await connectDB();
        console.log("Database connection established");
        
        // Default admin credentials - these could be provided by environment variables
        const adminUsername = process.env.ADMIN_USERNAME || "admin";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin@123";
        const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
        const adminFullName = process.env.ADMIN_FULLNAME || "System Administrator";

        const connection = getConnection();
        
        // Check if admin already exists
        const [existingAdmin] = await connection.query(
            "SELECT * FROM users WHERE id = ? OR email = ?",
            [adminUsername, adminEmail]
        );
        
        if (existingAdmin.length > 0) {
            console.log("Admin user already exists.");
            return;
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        // Insert the admin user
        await connection.query(
            "INSERT INTO users (full_name, email, id, password, phone_number, is_admin) VALUES (?, ?, ?, ?, ?, ?)",
            [adminFullName, adminEmail, adminUsername, hashedPassword, "", 1]
        );
        
        console.log("Initial admin user created successfully!");
        console.log(`Username: ${adminUsername}`);
        console.log(`Password: ${adminPassword}`);
        console.log("Please change the default password after first login!");
        
        // Close the connection
        await connection.end();
        
        process.exit(0);
    } catch (error) {
        console.error("Error creating initial admin:", error);
        process.exit(1);
    }
};

createInitialAdmin();