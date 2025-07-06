import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail } from "../utils/emailService.js";
import { getConnection } from "../db/index.js";

// Upload license with file stored directly in DB
const uploadLicense = asyncHandler(async (req, res) => {
    const { expiry_date, department_id } = req.body;

    if (!req.body.file || !expiry_date || !department_id) {
        throw new ApiError(400, "File, expiry date and department ID are required");
    }

    // Get file data from request body
    const fileData = req.body.file;
    const fileBuffer = Buffer.from(fileData.data, 'base64');
    const fileType = fileData.type;
    const fileName = fileData.name;

    // Validate file type (only PDF or PNG)
    if (!fileType.match(/^(application\/pdf|image\/png)$/)) {
        throw new ApiError(400, "Only PDF and PNG files are allowed");
    }

    // Verify department exists
    const connection = getConnection();
    const [departmentCheck] = await connection.execute(
        'SELECT name FROM departments WHERE department_id = ?',
        [department_id]
    );

    if (departmentCheck.length === 0) {
        throw new ApiError(400, "Invalid department ID");
    }

    // Store file directly in database
    const [result] = await connection.execute(
        'INSERT INTO licenses (file_name, file_data, file_type, expiry_date, department_id) VALUES (?, ?, ?, ?, ?)',
        [fileName, fileBuffer, fileType, expiry_date, department_id]
    );

    return res.status(201).json(
        new ApiResponse(201, { licenseId: result.insertId }, "License uploaded successfully")
    );
});

// Get all licenses
const getAllLicenses = asyncHandler(async (req, res) => {
    const connection = getConnection(); const [licenses] = await connection.execute(
        'SELECT l.id, l.file_name, l.file_type, l.department_id, d.name AS department_name, ' +
        'DATE_FORMAT(l.expiry_date, \'%d-%m-%Y\') AS expiry_date ' +
        'FROM licenses l ' +
        'LEFT JOIN departments d ON l.department_id = d.department_id ' +
        'ORDER BY l.expiry_date'
    );

    return res.status(200).json(
        new ApiResponse(200, licenses, "Licenses retrieved successfully")
    );
});

// Get expiring licenses (expiring in next 5 days)
const getExpiringLicenses = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setDate(today.getDate() + 15); // Get date 5 days ahead
    const expiryDate = today.toISOString().split('T')[0];

    const connection = getConnection();
    const [licenses] = await connection.execute(
        'SELECT l.id, l.file_name, l.file_type, l.department_id, d.name AS department_name, ' +
        'DATE_FORMAT(l.expiry_date, \'%d-%m-%Y\') AS expiry_date ' +
        'FROM licenses l ' +
        'LEFT JOIN departments d ON l.department_id = d.department_id ' +
        'WHERE l.expiry_date <= ? ' +
        'ORDER BY l.expiry_date',
        [expiryDate]
    );

    return res.status(200).json(
        new ApiResponse(200, licenses, "Expiring licenses retrieved successfully")
    );
});

// Get license file by ID
const getLicenseFile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tokenFromQuery = req.query.token; // Get token from URL query parameter

    // If token provided in URL but not in header, add it to the request
    if (tokenFromQuery && !req.headers.authorization) {
        req.headers.authorization = `Bearer ${tokenFromQuery}`;
    }

    const connection = getConnection();
    const [license] = await connection.execute('SELECT file_data, file_type, file_name FROM licenses WHERE id = ?', [id]);

    if (license.length === 0) {
        throw new ApiError(404, "License not found");
    }

    const fileData = license[0].file_data;
    const fileType = license[0].file_type;
    const fileName = license[0].file_name;

    res.setHeader('Content-Type', fileType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    return res.send(fileData);
});

// Update license
const updateLicense = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { expiry_date, department_id, file } = req.body;

    const connection = getConnection();
    // Get existing license
    const [existing] = await connection.execute('SELECT id FROM licenses WHERE id = ?', [id]);

    if (existing.length === 0) {
        throw new ApiError(404, "License not found");
    }

    let updateQuery = 'UPDATE licenses SET ';
    const queryParams = [];
    const updateFields = [];

    if (expiry_date) {
        updateFields.push('expiry_date = ?');
        queryParams.push(expiry_date);
    }

    if (department_id) {
        // Verify department exists
        const [departmentCheck] = await connection.execute(
            'SELECT name FROM departments WHERE department_id = ?',
            [department_id]
        );

        if (departmentCheck.length === 0) {
            throw new ApiError(400, "Invalid department ID");
        }

        updateFields.push('department_id = ?');
        queryParams.push(department_id);
    }

    if (file) {
        // Validate file type
        if (!file.type.match(/^(application\/pdf|image\/png)$/)) {
            throw new ApiError(400, "Only PDF and PNG files are allowed");
        }

        const fileBuffer = Buffer.from(file.data, 'base64');
        updateFields.push('file_name = ?, file_data = ?, file_type = ?');
        queryParams.push(file.name, fileBuffer, file.type);
    }

    if (updateFields.length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    updateQuery += updateFields.join(', ') + ' WHERE id = ?';
    queryParams.push(id);

    await connection.execute(updateQuery, queryParams);

    return res.status(200).json(
        new ApiResponse(200, {}, "License updated successfully")
    );
});

// Delete license
const deleteLicense = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "License ID is required");
    }

    const connection = getConnection();

    // Check if license exists
    const [existing] = await connection.execute('SELECT id, file_name FROM licenses WHERE id = ?', [id]);

    if (existing.length === 0) {
        throw new ApiError(404, "License not found");
    }

    // Delete the license
    await connection.execute('DELETE FROM licenses WHERE id = ?', [id]);

    return res.status(200).json(
        new ApiResponse(200, { id }, "License deleted successfully")
    );
});

// Check for expiring licenses and send emails (to be called by cron job)
const checkAndNotifyExpiringLicenses = asyncHandler(async () => {
    try {
        const today = new Date();
        today.setDate(today.getDate() + 15); // Get date 15 days ahead
        const expiryDate = today.toISOString().split('T')[0];

        const connection = getConnection();
        // Fetch all licenses expiring in 5 days with department names
        const [licenses] = await connection.execute(
            'SELECT l.file_name, l.department_id, d.name AS department_name, ' +
            'DATE_FORMAT(l.expiry_date, \'%d-%m-%Y\') AS expiry_date ' +
            'FROM licenses l ' +
            'LEFT JOIN departments d ON l.department_id = d.department_id ' +
            'WHERE l.expiry_date <= ?',
            [expiryDate]
        );

        if (licenses.length === 0) {
            console.log('No licenses expiring soon.');
            return;
        }

        // Group licenses by department
        const departmentLicenses = {};
        licenses.forEach(license => {
            if (!departmentLicenses[license.department_id]) {
                departmentLicenses[license.department_id] = {
                    name: license.department_name,
                    licenses: []
                };
            }
            departmentLicenses[license.department_id].licenses.push(license);
        });

        // Send one email per department
        for (const [departmentId, department] of Object.entries(departmentLicenses)) {
            const [employees] = await connection.execute(
                'SELECT email FROM users WHERE department_id = ?',
                [departmentId]
            );

            if (employees.length === 0) continue;

            // Create email body with all expiring licenses
            const licenseList = department.licenses.map(license =>
                `- ${license.file_name} (Expiry Date: ${license.expiry_date})`
            ).join("\n");

            const emailText = `Dear ${department.name} Team,\n\nThe following licenses in your department are expiring soon:\n\n${licenseList}\n\nPlease take necessary action.\n\nBest Regards,\nLicense Management System`;

            const recipients = employees.map(emp => emp.email).join(',');

            // Send email to all department employees
            await sendEmail(
                recipients,
                `License Expiry Reminder - ${department.name} Department`,
                emailText
            );

            console.log(`Email sent to ${department.name} Department (ID: ${departmentId})`);
        }
    } catch (error) {
        console.error('Error sending license expiry emails:', error);
    }
});

export {
    uploadLicense,
    getAllLicenses,
    getExpiringLicenses,
    getLicenseFile,
    updateLicense,
    deleteLicense,
    checkAndNotifyExpiringLicenses
};