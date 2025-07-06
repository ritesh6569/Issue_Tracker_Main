import { getConnection } from "../db/index.js";  // Assuming you have a connection utility
import { sendEmail } from "../utils/emailService.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Helper function to get the current time in DD/MM/YYYY HH:MM:SS format
const giveTime = () => {
    const currentTime = new Date();
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');

    // Return the date in the format 'YYYY-MM-DD HH:MM:SS'
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


// Create a new issue
const createIssue = async (req, res) => {
    try {
        const { issue, description, address, requireDepartment } = req.body;

        if ([issue, address, requireDepartment].some((field) => field?.trim() === "")) {
            return res.status(400).json(new ApiResponse(400, null, "All fields are required"));
        }

        const connection = await getConnection();
        
        // Check if department exists
        const [dept] = await connection.query("SELECT department_id FROM departments WHERE name = ?", requireDepartment);
        
        if (!dept || dept.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "Department not found"));
        }
        
        // Check if there are users in the department
        const [availableUsers] = await connection.query("SELECT * FROM users WHERE department_id = ?", dept[0].department_id);
        
        let warningMessage = null;
        if (!availableUsers || availableUsers.length === 0) {
            warningMessage = "Warning: No users available in the required department. Issue will be created but cannot be assigned.";
        }

        const createdAt = giveTime();  // Returns correct date format

        // Insert the issue
        const [result] = await connection.query(
            "INSERT INTO issues (issue, description, address, require_department_id, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [issue, description, address, dept[0].department_id, req.user.id, createdAt]
        );
        
        // If users are available, send email notification
        if (availableUsers && availableUsers.length > 0) {
            // Email all users in the department
            let emailsSent = 0;
            let emailErrors = 0;
            
            // Prepare the email content
            const subject = 'New Issue Assigned to Your Department';
            
            // Send email to each user in the department who has an email
            for (const user of availableUsers) {
                if (user && user.email) {
                    try {
                        const text = `Dear ${user.full_name || user.id},

A new issue has been assigned to your department:

Issue: ${issue}
Description: ${description}
Address: ${address}
Created on: ${createdAt}

Please coordinate with your team to address this issue as soon as possible.

Thank you,
UAIMS Issue Tracking System`;

                        await sendEmail(user.email, subject, text);
                        emailsSent++;
                        console.log(`Email notification sent to ${user.email} for new issue`);
                    } catch (emailError) {
                        emailErrors++;
                        console.error(`Failed to send email to ${user.email}:`, emailError);
                    }
                }
            }
            
            if (emailsSent === 0 && emailErrors > 0) {
                console.warn(`Failed to send emails to any users in department ${requireDepartment}`);
            } else if (emailsSent > 0) {
                console.log(`Successfully sent email notifications to ${emailsSent} users in department ${requireDepartment}`);
            } else {
                console.warn(`No users with email addresses found in department ${requireDepartment}`);
            }
        } else {
            console.warn("No users available in department", requireDepartment);
        }

        return res.status(201).json(
            new ApiResponse(201, 
                { 
                    id: result.insertId,
                    issue, 
                    description, 
                    address, 
                    requireDepartment,
                    warning: warningMessage
                }, 
                warningMessage || "Issue created successfully"
            )
        );
    } catch (error) {
        console.error("Error creating issue:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "An error occurred while creating the issue: " + error.message)
        );
    }
};



// Fetch issues for a department
const getissue = async (req, res) => {
    const connection = await getConnection();
    
    const [departmentId] = await connection.query("SELECT department_id FROM users WHERE id = ? ", [req.user.id]);    

    const [issues] = await connection.query("SELECT * FROM issues WHERE require_department_id = ? AND complete = false", [departmentId[0].department_id]);
    
    res.status(200).json(new ApiResponse(200, issues, "Issues fetched successfully"));
};

// Fetch issues for a user
const getIssueforuser = async (req, res) => {
    const connection = await getConnection();
    
    const [issues] = await connection.query("SELECT * FROM issues WHERE user_id = ? AND complete = false", [req.user.id]);

    res.status(200).json(new ApiResponse(200, issues, "Issues fetched successfully for the user"));
};

// Update responses for a department
const updateResponses = async (req, res) => {
    const { description, requirements, actionTaken, complete } = req.body;
    const connection = await getConnection();

    const [issues] = await connection.query("SELECT * FROM issues WHERE requireDepartment = ?", [req.user.department]);

    if (issues.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No issues found for the department"));
    }

    const updatedResponses = [];

    for (const issue of issues) {
        const [response] = await connection.query("SELECT * FROM responses WHERE issueId = ?", [issue._id]);
        if (response) {
            const [updatedResponse] = await connection.query(
                "UPDATE responses SET description = ?, requirements = ?, actionTaken = ?, complete = ? WHERE issueId = ?",
                [description, requirements, actionTaken, complete, issue._id]
            );
            updatedResponses.push(updatedResponse);
        }
    }

    if (updatedResponses.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No responses found to update"));
    }

    res.status(200).json(new ApiResponse(200, updatedResponses, "Responses updated successfully"));
};

// Complete a specific report
const completeIssue = async (req, res) => {
    try {
        const { issueId } = req.body;
        const connection = await getConnection();

        // Get detailed issue information including the user who raised it
        const [issueDetails] = await connection.query(`
            SELECT 
                i.*,
                u.email as user_email,
                u.full_name as user_full_name,
                u.id as user_id_login,
                d.name as department_name
            FROM 
                issues i
            LEFT JOIN 
                users u ON i.user_id = u.id
            LEFT JOIN 
                departments d ON i.require_department_id = d.department_id
            WHERE 
                i.id = ?
        `, [issueId]);

        if (!issueDetails || issueDetails.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "No issue found with the provided ID"));
        }

        const issue = issueDetails[0];
        
        // Check if user has permission to complete this issue
        // Allow if user is admin or if the issue belongs to user's department
        const [userInfo] = await connection.query(
            "SELECT is_admin, department_id FROM users WHERE id = ?", 
            [req.user.id]
        );
        
        

        // Update the issue to mark it as complete
        await connection.query("UPDATE issues SET complete = true, updated_at = ? WHERE id = ?", [giveTime(), issueId]);

        // Send email notification to the user who raised the issue
        if (issue.user_email) {
            try {
                const userName = issue.user_full_name || issue.user_id_login || "User";
                const subject = 'Issue Resolved: ' + (issue.issue || 'Your Issue');
                
                const emailText = `Dear ${userName},

We are pleased to inform you that your issue has been resolved:

Issue ID: ${issue.id}
Issue: ${issue.issue || 'N/A'}
Description: ${issue.description || 'N/A'}
Department: ${issue.department_name || 'N/A'}
Resolved on: ${new Date().toLocaleString()}

Thank you for using our Issue Tracking System.

Best regards,
UIAMS Support Team`;

                await sendEmail(issue.user_email, subject, emailText);
                console.log(`Resolution notification email sent to ${issue.user_email} for issue ID ${issueId}`);
            } catch (emailError) {
                // Log the error but don't fail the request
                console.error("Failed to send email notification:", emailError);
                console.error("Email data:", {
                    email: issue.user_email,
                    issueId: issueId,
                    userName: issue.user_full_name || issue.user_id_login,
                    issueName: issue.issue
                });
            }
        } else {
            console.warn(`No email found for user (ID: ${issue.user_id}) to send resolution notification`);
        }

        // Add information about who completed the issue (admin or department)
        res.status(200).json(new ApiResponse(200, { issue: issue }, "Issue marked as complete successfully"));
    } catch (error) {
        console.error("Error completing issue:", error);
        res.status(500).json(new ApiResponse(500, null, "An error occurred while completing the issue"));
    }
};

// Acknowledge a response
const acknowledgeResponse = async (req, res) => {
    const { responseId } = req.body;
    const connection = await getConnection();

    // First, get the current issue status to preserve completion status
    const [currentIssue] = await connection.query("SELECT * FROM issues WHERE id = ?", [responseId]);
    
    if (!currentIssue || currentIssue.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No issue found with the provided ID"));
    }

    const currentTime = giveTime();
    console.log(responseId);
    
    // Update only the acknowledge_at field, explicitly setting complete to false
    await connection.query("UPDATE issues SET acknowledge_at = ?, complete = false WHERE id = ?", [currentTime, responseId]);

    res.status(200).json(new ApiResponse(200, "Response acknowledged successfully"));
};

const fetchReport = async (req, res) => {
    const connection = await getConnection();

    const [problems] = await connection.query(`
        SELECT 
            i.id,
            i.issue,
            i.description,
            i.address,
            rd.name AS required_department_name,
            u.full_name AS user_name,
            ud.name AS user_department_name,
            i.complete,
            DATE_FORMAT(CONVERT_TZ(i.acknowledge_at, '+00:00','+00:00'), '%d-%m-%Y %H:%i:%s') AS acknowledge_at,
            DATE_FORMAT(CONVERT_TZ(i.created_at, '+00:00','+00:00'), '%d-%m-%Y %H:%i:%s') AS created_at,
            DATE_FORMAT(CONVERT_TZ(i.updated_at, '+00:00','+00:00'), '%d-%m-%Y %H:%i:%s') AS updated_at
        FROM 
            issues i
        JOIN 
            departments rd ON i.require_department_id = rd.department_id
        LEFT JOIN 
            users u ON i.user_id = u.id
        LEFT JOIN 
            departments ud ON u.department_id = ud.department_id
    `);

    // console.log(problems);

    res.status(200).json(new ApiResponse(200, problems, "Completed problems and responses fetched successfully"));
};


// Fetch admin's department
const getAdmin = async (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user.department, "Department fetched successfully for the user"));
};

export {
    createIssue,
    getissue,
    getIssueforuser,
    updateResponses,
    completeIssue,
    acknowledgeResponse,
    fetchReport,
    getAdmin,
};